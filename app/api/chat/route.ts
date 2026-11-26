import {
  executeAgentTool,
  GEMINI_TOOLS,
  mapPostsToSuggestions,
  mapProductsToSuggestions,
  SYSTEM_INSTRUCTION,
  ToolExecutionAccumulator,
} from '@/lib/chatbot';

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
];

const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const BASE64_REGEX = /^[A-Za-z0-9+/]+={0,2}$/;
const MAX_BODY_BYTES = 5_500_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQ = 15;

const globalRateLimit = globalThis as unknown as {
  __meocungChatRateLimit?: Map<string, number[]>;
};

function checkRateLimit(ip: string): boolean {
  if (!globalRateLimit.__meocungChatRateLimit) {
    globalRateLimit.__meocungChatRateLimit = new Map();
  }
  const store = globalRateLimit.__meocungChatRateLimit;
  const now = Date.now();
  const timestamps = (store.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX_REQ) {
    store.set(ip, timestamps);
    return false;
  }
  timestamps.push(now);
  store.set(ip, timestamps);
  return true;
}

async function callGeminiWithFallback(
  apiKey: string,
  endpoint: 'generateContent' | 'streamGenerateContent',
  payload: Record<string, unknown>,
  requestSignal: AbortSignal
): Promise<{ res: Response; model: string } | null> {
  const suffix = endpoint === 'streamGenerateContent' ? '?alt=sse&key=' : '?key=';
  for (const model of GEMINI_MODELS) {
    if (requestSignal.aborted) return null;
    const bodyPayload =
      model === 'gemini-2.5-flash'
        ? payload
        : {
            ...payload,
            generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
          };
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:${endpoint}${suffix}${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
          signal: AbortSignal.any([requestSignal, AbortSignal.timeout(25_000)]),
        }
      );
      if (res.ok) {
        return { res, model };
      }
      if (res.status === 429 || res.status === 503 || res.status === 404) {
        console.warn(`[Gemini Fallback] Model ${model} returned ${res.status}, trying next model...`);
        continue;
      }
      const errTxt = await res.text();
      console.error(`[Gemini Error] Model ${model} returned ${res.status}:`, errTxt);
      return null;
    } catch (err) {
      if (requestSignal.aborted) return null;
      console.warn(`[Gemini Fallback] Model ${model} fetch failed:`, err);
      continue;
    }
  }
  return null;
}

function encodeSSE(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
  functionCall?: {
    name: string;
    args?: Record<string, unknown>;
  };
  functionResponse?: {
    name: string;
    response: Record<string, unknown>;
  };
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

function normalizeHistory(rawHistory: unknown): GeminiContent[] {
  if (!Array.isArray(rawHistory)) return [];
  const normalized: GeminiContent[] = [];

  for (const h of rawHistory.slice(-6)) {
    if (
      !h ||
      typeof h !== 'object' ||
      (h.role !== 'user' && h.role !== 'assistant') ||
      typeof h.content !== 'string' ||
      !h.content.trim()
    ) {
      continue;
    }
    const role: 'user' | 'model' = h.role === 'assistant' ? 'model' : 'user';
    const text = h.content.trim();

    // Gemini requires history to start with 'user'
    if (normalized.length === 0 && role === 'model') continue;

    // Merge consecutive same-role messages to guarantee strict alternation
    const prev = normalized[normalized.length - 1];
    if (prev && prev.role === role) {
      prev.parts.push({ text });
    } else {
      normalized.push({ role, parts: [{ text }] });
    }
  }

  // Ensure the last history entry is 'model' so appending the new 'user' turn alternates properly
  while (normalized.length > 0 && normalized[normalized.length - 1].role === 'user') {
    normalized.pop();
  }

  return normalized;
}

export async function POST(request: Request) {
  // Per-IP rate limit (15 req/min)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'local';
  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: 'Bạn gửi tin nhắn quá nhanh. Vui lòng đợi 1 phút rồi thử lại.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Reject oversized payloads before JSON parsing
  const contentLength = Number(request.headers.get('content-length') || '0');
  if (contentLength > MAX_BODY_BYTES) {
    return new Response(
      JSON.stringify({ error: 'Dữ liệu gửi lên quá lớn (tối đa 5MB).' }),
      { status: 413, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object') {
      return new Response(JSON.stringify({ error: 'Dữ liệu không hợp lệ.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    body = parsed;
  } catch {
    return new Response(JSON.stringify({ error: 'JSON không hợp lệ.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const rawImage =
    body.image && typeof body.image === 'object'
      ? (body.image as { mimeType?: unknown; data?: unknown })
      : null;

  let image: { mimeType: string; data: string } | null = null;
  if (rawImage) {
    const mime = typeof rawImage.mimeType === 'string' ? rawImage.mimeType.trim() : '';
    const data = typeof rawImage.data === 'string' ? rawImage.data.trim() : '';
    if (!ALLOWED_IMAGE_MIMES.has(mime)) {
      return new Response(
        JSON.stringify({ error: 'Định dạng ảnh không hỗ trợ. Vui lòng dùng JPG, PNG hoặc WebP.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!data || data.length > 4_000_000 || !BASE64_REGEX.test(data)) {
      return new Response(
        JSON.stringify({ error: 'Dữ liệu ảnh không hợp lệ hoặc quá lớn.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    image = { mimeType: mime, data };
  }

  if (!message && !image) {
    return new Response(
      JSON.stringify({ error: 'Vui lòng nhập nội dung câu hỏi hoặc chọn 1 ảnh.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (message.length > 500) {
    return new Response(JSON.stringify({ error: 'Câu hỏi quá dài (tối đa 500 ký tự).' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY?.replace(/[\uFEFF\r\n]/g, '').trim();
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Chưa cấu hình GEMINI_API_KEY trong biến môi trường.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const contents: GeminiContent[] = normalizeHistory(body.history);
  const userParts: GeminiPart[] = [];
  if (image) {
    userParts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
  }
  userParts.push({
    text:
      message ||
      'Hãy xem hình ảnh này (sản phẩm hoặc bé mèo) và dùng công cụ tìm kiếm để tư vấn sản phẩm phù hợp nhất trong cửa hàng Mèo Cưng cho mình nhé.',
  });
  contents.push({ role: 'user', parts: userParts });

  const stream = new ReadableStream({
    async start(controller) {
      const acc: ToolExecutionAccumulator = { products: [], posts: [] };
      let closed = false;

      const safeEnqueue = (chunk: Uint8Array) => {
        if (closed || request.signal.aborted) return;
        try {
          controller.enqueue(chunk);
        } catch {
          closed = true;
        }
      };

      const safeClose = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {}
      };

      try {
        // Step 1: Agentic Tool-Calling Loop (max 2 tool rounds)
        for (let step = 0; step < 2; step++) {
          const planCall = await callGeminiWithFallback(
            apiKey,
            'generateContent',
            {
              systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
              contents,
              tools: GEMINI_TOOLS,
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1024,
                thinkingConfig: { thinkingBudget: 0 },
              },
            },
            request.signal
          );

          if (!planCall) {
            safeEnqueue(
              encodeSSE('chunk', {
                text: 'Tài khoản Gemini Free Tier hiện đã hết lượt gọi trong ngày hoặc đang bận. Bạn vui lòng thử lại sau nhé!',
              })
            );
            safeEnqueue(encodeSSE('done', {}));
            safeClose();
            return;
          }

          const planData = await planCall.res.json();
          const modelParts: GeminiPart[] =
            planData?.candidates?.[0]?.content?.parts || [];
          const functionCalls = modelParts.filter((p) => p.functionCall);

          if (functionCalls.length === 0) {
            const directText = modelParts
              .map((p) => p.text || '')
              .join('')
              .trim();
            if (directText) {
              const chunks = directText.split(/(\s+)/);
              for (let i = 0; i < chunks.length; i += 4) {
                safeEnqueue(
                  encodeSSE('chunk', { text: chunks.slice(i, i + 4).join('') })
                );
              }
            } else {
              safeEnqueue(
                encodeSSE('chunk', {
                  text: 'Mình chưa tìm thấy thông tin phù hợp. Bạn thử mô tả cụ thể hơn giúp mình nhé!',
                })
              );
            }
            safeEnqueue(
              encodeSSE('meta', {
                products: mapProductsToSuggestions(acc.products),
                posts: mapPostsToSuggestions(acc.posts),
                source: 'gemini-agentic',
              })
            );
            safeEnqueue(encodeSSE('done', {}));
            safeClose();
            return;
          }

          contents.push({ role: 'model', parts: modelParts });
          const toolResponseParts: GeminiPart[] = [];
          for (const fcPart of functionCalls) {
            const fc = fcPart.functionCall!;
            const toolResult = await executeAgentTool(fc.name, fc.args || {}, acc);
            toolResponseParts.push({
              functionResponse: {
                name: fc.name,
                response: toolResult,
              },
            });
          }
          contents.push({ role: 'user', parts: toolResponseParts });
        }

        // Step 2: Stream final text answer (mode: NONE prevents a 3rd functionCall)
        const streamCall = await callGeminiWithFallback(
          apiKey,
          'streamGenerateContent',
          {
            systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            contents,
            tools: GEMINI_TOOLS,
            toolConfig: { functionCallingConfig: { mode: 'NONE' } },
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1024,
              thinkingConfig: { thinkingBudget: 0 },
            },
          },
          request.signal
        );

        let emittedAnyText = false;

        const processSSELine = (rawLine: string) => {
          const trimmed = rawLine.trim();
          if (!trimmed.startsWith('data:')) return;
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr || jsonStr === '[DONE]') return;
          try {
            const parsed = JSON.parse(jsonStr);
            const parts: GeminiPart[] = parsed?.candidates?.[0]?.content?.parts || [];
            const chunkText = parts.map((p) => p.text || '').join('');
            if (chunkText) {
              emittedAnyText = true;
              safeEnqueue(encodeSSE('chunk', { text: chunkText }));
            }
          } catch {}
        };

        if (streamCall && streamCall.res.body) {
          const reader = streamCall.res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              processSSELine(line);
            }
          }
          // Flush final decoder bytes & trailing buffer
          buffer += decoder.decode();
          if (buffer.trim()) {
            processSSELine(buffer);
          }
        }

        if (!emittedAnyText) {
          safeEnqueue(
            encodeSSE('chunk', {
              text:
                acc.products.length > 0
                  ? 'Dưới đây là các sản phẩm phù hợp nhất mình tìm thấy trong kho Mèo Cưng cho bạn:'
                  : 'Mình chưa tìm thấy sản phẩm khớp chính xác. Bạn thử hỏi cụ thể hơn nhé!',
            })
          );
        }

        safeEnqueue(
          encodeSSE('meta', {
            products: mapProductsToSuggestions(acc.products),
            posts: mapPostsToSuggestions(acc.posts),
            source: 'gemini-agentic',
          })
        );
        safeEnqueue(encodeSSE('done', {}));
        safeClose();
      } catch (err) {
        if (!request.signal.aborted) {
          console.error('[Gemini Agentic Stream] Error:', err);
          safeEnqueue(
            encodeSSE('chunk', {
              text: 'Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi. Bạn thử lại giúp mình nhé!',
            })
          );
          safeEnqueue(encodeSSE('done', {}));
        }
        safeClose();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
