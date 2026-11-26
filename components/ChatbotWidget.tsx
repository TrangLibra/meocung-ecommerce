'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import type { ChatProductSuggestion, ChatPostSuggestion } from '@/lib/chatbot';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  ShoppingCart,
  BookOpen,
  Bot,
  User,
  Check,
  Loader2,
  RotateCcw,
  ImagePlus,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imagePreview?: string;
  isError?: boolean;
  products?: ChatProductSuggestion[];
  posts?: ChatPostSuggestion[];
}

const MAX_IMAGE_FILE_BYTES = 10 * 1024 * 1024; // 10MB

async function compressImageToBase64(
  file: File
): Promise<{ dataUrl: string; mimeType: string; data: string }> {
  if (file.size > MAX_IMAGE_FILE_BYTES) {
    throw new Error('Ảnh quá lớn (tối đa 10MB).');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc file ảnh'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('File không phải ảnh hợp lệ'));
      img.onload = () => {
        const maxDim = 800;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas error'));
        // Fill white background so transparent PNGs don't turn black on JPEG export
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1] || '';
        resolve({ dataUrl, mimeType: 'image/jpeg', data: base64 });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

const QUICK_PROMPTS = [
  'Tìm hạt cho mèo dưới 200k',
  'So sánh Royal Canin và Reflex Plus',
  'Combo hạt + cát tầm 300k',
  'Cát vệ sinh khử mùi tốt',
];

function stripHiddenTags(text: string): string {
  return text.replace(/\[\[PRODUCTS:[^\]]*\]?\]?/g, '').trimEnd();
}

function renderInlineBold(line: string) {
  const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, j) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={j} className="font-bold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={j} className="italic text-gray-800">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={j}>{part}</React.Fragment>;
  });
}

function renderFormattedText(text: string) {
  const cleaned = stripHiddenTags(text);
  return cleaned.split('\n').map((rawLine, i) => {
    const trimmed = rawLine.trim();
    if (!trimmed) return <div key={i} className="h-1" />;

    // Horizontal rule (---)
    if (/^[-*_]{3,}$/.test(trimmed)) {
      return <hr key={i} className="my-2 border-gray-200" />;
    }

    // Headings (### Title)
    const headingMatch = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      return (
        <p key={i} className={`${i > 0 ? 'mt-2' : ''} font-bold text-gray-900`}>
          {renderInlineBold(headingMatch[1])}
        </p>
      );
    }

    // Bullet points (* item, - item, • item)
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      return (
        <div key={i} className={`${i > 0 ? 'mt-1' : ''} flex items-start gap-1.5`}>
          <span className="text-[#ff7f5c] font-bold leading-relaxed">•</span>
          <span className="flex-1">{renderInlineBold(bulletMatch[1])}</span>
        </div>
      );
    }

    return (
      <p key={i} className={i > 0 ? 'mt-1.5' : ''}>
        {renderInlineBold(rawLine)}
      </p>
    );
  });
}

const CHAT_STORAGE_KEY = 'meocung_chat_history';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Xin chào! 🐱 Mình là **Trợ lý AI Mèo Cưng**. Mình có thể tư vấn thức ăn hạt, pate, cát vệ sinh theo độ tuổi của mèo, so sánh sản phẩm hoặc đọc ảnh sản phẩm/bé mèo cho bạn!',
};

export default function ChatbotWidget() {
  const { addToCart } = useCart();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [pendingImage, setPendingImage] = useState<{
    dataUrl: string;
    mimeType: string;
    data: string;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const quickAddTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {}
    setHydrated(true);

    return () => {
      abortRef.current?.abort();
      if (quickAddTimerRef.current) clearTimeout(quickAddTimerRef.current);
    };
  }, []);

  // Close chat with Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const toSave = messages
        .filter((m) => !m.isError)
        .slice(-20)
        .map(({ imagePreview: _img, ...rest }) => rest);
      sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toSave));
    } catch {}
  }, [messages, hydrated]);

  const handleImageFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const compressed = await compressImageToBase64(file);
      setPendingImage(compressed);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Không thể đọc ảnh này. Vui lòng chọn ảnh JPG/PNG khác.'
      );
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          handleImageFile(file);
          break;
        }
      }
    }
  };

  const handleResetChat = () => {
    abortRef.current?.abort();
    setLoading(false);
    setPendingImage(null);
    setMessages([WELCOME_MESSAGE]);
    try {
      sessionStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {}
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  const sendMessage = async (text: string, includeImage = true) => {
    const trimmed = text.trim();
    const imageToSend = includeImage ? pendingImage : null;
    if ((!trimmed && !imageToSend) || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed || '📷 Đã gửi 1 hình ảnh để tư vấn',
      imagePreview: imageToSend?.dataUrl,
    };
    const assistantId = `a-${Date.now() + 1}`;

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: 'assistant', content: '', products: [], posts: [] },
    ]);
    if (includeImage) {
      setInput('');
      setPendingImage(null);
    }
    setLoading(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome' && !m.isError && m.content.trim())
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: trimmed,
          history,
          image: imageToSend
            ? { mimeType: imageToSend.mimeType, data: imageToSend.data }
            : undefined,
        }),
      });

      if (!res.ok || !res.body) {
        let errText = 'Xin lỗi, mình chưa thể trả lời lúc này.';
        try {
          const errData = await res.json();
          if (errData?.error) errText = errData.error;
        } catch {}
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: errText, isError: true } : m
          )
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = 'chunk';

      const processLine = (rawLine: string) => {
        const line = rawLine.trim();
        if (line === '') {
          currentEvent = 'chunk';
          return;
        }
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          const dataStr = line.slice(5).trim();
          if (!dataStr) return;
          try {
            const payload = JSON.parse(dataStr);
            if (currentEvent === 'chunk' && typeof payload.text === 'string') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + payload.text }
                    : m
                )
              );
            } else if (currentEvent === 'meta') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        products: payload.products || [],
                        posts: payload.posts || [],
                      }
                    : m
                )
              );
            }
          } catch {}
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const rawLine of lines) {
          processLine(rawLine);
        }
      }

      // Flush remaining UTF-8 bytes & trailing line
      buffer += decoder.decode();
      if (buffer.trim()) {
        processLine(buffer);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: 'Lỗi kết nối máy chủ. Bạn thử gửi lại giúp mình nhé!',
                isError: true,
              }
            : m
        )
      );
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input, true);
  };

  const handleQuickAdd = (item: ChatProductSuggestion) => {
    addToCart(item.product, 1);
    setAddedId(item.id);
    if (quickAddTimerRef.current) clearTimeout(quickAddTimerRef.current);
    quickAddTimerRef.current = setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Chat Window (shadcn-inspired clean surface) */}
      {open && (
        <div
          role="dialog"
          aria-label="Trợ lý AI Mèo Cưng"
          className="mb-3 w-[calc(100vw-2.5rem)] sm:w-[390px] h-[540px] max-h-[80vh] bg-white rounded-2xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-[#ff7f5c] to-[#ff987c] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold leading-none">Trợ lý AI Mèo Cưng</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                </div>
                <p className="text-[11px] text-white/90 mt-0.5">
                  Tư vấn sản phẩm & cẩm nang RAG
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 rounded-lg hover:bg-white/20 transition cursor-pointer"
                title="Làm mới cuộc trò chuyện"
                aria-label="Làm mới cuộc trò chuyện"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition cursor-pointer"
                aria-label="Đóng khung chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Message Scroller Thread */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fafafa]"
          >
            {messages.map((msg) => {
              // Hide empty placeholder bubble while waiting for first SSE chunk
              if (
                msg.role === 'assistant' &&
                !msg.content &&
                !msg.products?.length &&
                !msg.posts?.length
              ) {
                return null;
              }

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-orange-100 text-[#ff7f5c] flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] space-y-2.5 ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                        msg.role === 'user'
                          ? 'bg-[#ff7f5c] text-white rounded-br-sm'
                          : msg.isError
                          ? 'bg-red-50 border border-red-200 text-red-700 rounded-bl-sm'
                          : 'bg-white border border-gray-200/80 text-gray-700 rounded-bl-sm'
                      }`}
                    >
                      {msg.imagePreview && (
                        <img
                          src={msg.imagePreview}
                          alt="Ảnh đã gửi"
                          className="mb-2 rounded-xl max-h-40 w-auto object-cover border border-white/20"
                        />
                      )}
                      {msg.role === 'user' ? (
                        <p>{msg.content}</p>
                      ) : (
                        renderFormattedText(msg.content)
                      )}
                    </div>

                    {/* Suggested Products from Store Data */}
                    {msg.products && msg.products.length > 0 && (
                      <div className="space-y-2">
                        {msg.products.map((item) => (
                          <div
                            key={item.id}
                            className="bg-white border border-gray-200 rounded-xl p-2.5 flex items-center gap-2.5 hover:border-[#ff7f5c]/50 transition shadow-2xs"
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 rounded-lg object-cover bg-gray-50 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/products/${item.id}`}
                                onClick={() => setOpen(false)}
                                className="text-[11px] font-bold text-gray-800 hover:text-[#ff7f5c] line-clamp-1 block"
                              >
                                {item.name}
                              </Link>
                              <div className="text-[11px] font-black text-[#ff7f5c] mt-0.5">
                                {item.price.toLocaleString('vi-VN')}₫
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(item)}
                              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 transition cursor-pointer ${
                                addedId === item.id
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-orange-50 text-[#ff7f5c] hover:bg-[#ff7f5c] hover:text-white'
                              }`}
                            >
                              {addedId === item.id ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Đã thêm</span>
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="w-3 h-3" />
                                  <span>+ Giỏ</span>
                                </>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Suggested Blog Posts */}
                    {msg.posts && msg.posts.length > 0 && (
                      <div className="space-y-1.5">
                        {msg.posts.map((post) => (
                          <Link
                            key={post.slug}
                            href={`/posts/${post.slug}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 bg-blue-50/70 hover:bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-[11px] font-semibold text-blue-700 transition"
                          >
                            <BookOpen className="w-3.5 h-3.5 shrink-0" />
                            <span className="line-clamp-1">{post.title}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-7 h-7 rounded-full bg-orange-100 text-[#ff7f5c] flex items-center justify-center">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </div>
                <span className="bg-white border border-gray-200 rounded-2xl px-3 py-2">
                  Đang tra cứu dữ liệu Mèo Cưng...
                </span>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-white border-t border-gray-100 flex flex-wrap gap-1.5 shrink-0">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={loading}
                onClick={() => sendMessage(q, false)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-100 hover:bg-orange-50 hover:text-[#ff7f5c] text-gray-600 whitespace-nowrap transition cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Pending Image Preview */}
          {pendingImage && (
            <div className="px-3 pt-2 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0">
              <div className="relative inline-block">
                <img
                  src={pendingImage.dataUrl}
                  alt="Ảnh chuẩn bị gửi"
                  className="h-14 w-14 rounded-xl object-cover border border-orange-200"
                />
                <button
                  type="button"
                  onClick={() => setPendingImage(null)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-red-500 transition cursor-pointer"
                  aria-label="Xóa ảnh"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <span className="text-[11px] text-gray-500">
                Đã chọn ảnh • Nhập thêm câu hỏi hoặc bấm Gửi
              </span>
            </div>
          )}

          {/* Input Composer */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                handleImageFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-orange-50 hover:text-[#ff7f5c] text-gray-600 flex items-center justify-center shrink-0 transition cursor-pointer"
              title="Chọn ảnh từ máy (hoặc Ctrl+V để dán ảnh)"
              aria-label="Chọn ảnh"
            >
              <ImagePlus className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={handlePaste}
              placeholder="Hỏi hoặc dán/chọn ảnh sản phẩm, bé mèo..."
              className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:bg-white focus:border-[#ff7f5c] focus:ring-2 focus:ring-[#ff7f5c]/15 transition"
            />
            <button
              type="submit"
              disabled={loading || (!input.trim() && !pendingImage)}
              className="w-9 h-9 rounded-xl bg-[#ff7f5c] hover:bg-[#f0643d] disabled:opacity-50 text-white flex items-center justify-center shrink-0 transition cursor-pointer"
              aria-label="Gửi tin nhắn"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Launcher Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="group flex items-center gap-2 px-4 py-3 rounded-full bg-[#ff7f5c] hover:bg-[#f0643d] text-white shadow-lg shadow-orange-300/60 transition-all hover:scale-105 cursor-pointer"
        aria-label={open ? 'Đóng Trợ lý AI Mèo Cưng' : 'Mở Trợ lý AI Mèo Cưng'}
      >
        {open ? (
          <X className="w-5 h-5" />
        ) : (
          <>
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs font-bold pr-0.5">Tư vấn AI</span>
          </>
        )}
      </button>
    </div>
  );
}
