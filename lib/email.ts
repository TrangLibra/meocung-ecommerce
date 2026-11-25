import nodemailer from 'nodemailer';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SendEmailResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

function cleanFromName(raw?: string): string {
  const cleaned = (raw || '').replace(/[\uFEFF\r\n]/g, '').trim();
  if (!cleaned || /[ÃÆÂ]/.test(cleaned)) {
    return 'Mèo Cưng';
  }
  return cleaned;
}

export async function sendEmailWithGmailSMTP(
  input: SendEmailInput
): Promise<SendEmailResult> {
  const gmailUser = process.env.GMAIL_USER?.replace(/[\uFEFF\r\n]/g, '').trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.replace(/[\uFEFF\r\n]/g, '').trim();
  const fromName = cleanFromName(process.env.GMAIL_FROM_NAME || process.env.SENDGRID_FROM_NAME);

  if (!gmailUser || !gmailPass) {
    return {
      ok: false,
      skipped: true,
      error: 'Chưa cấu hình GMAIL_USER hoặc GMAIL_APP_PASSWORD.',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailPass.replace(/\s+/g, ''),
      },
    });

    await transporter.sendMail({
      from: `"${fromName}" <${gmailUser}>`,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định';
    console.error('[Gmail SMTP] Gửi email thất bại:', message);
    return { ok: false, error: message };
  }
}

export async function sendEmailWithSendGrid(
  input: SendEmailInput
): Promise<SendEmailResult> {
  // Ưu tiên gửi trực tiếp qua Gmail SMTP (vào thẳng Inbox, không bị vào Spam)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return sendEmailWithGmailSMTP(input);
  }

  const apiKey = process.env.SENDGRID_API_KEY?.replace(/[\uFEFF\r\n]/g, '').trim();
  const fromEmail = process.env.SENDGRID_FROM_EMAIL?.replace(/[\uFEFF\r\n]/g, '').trim();
  const fromName = cleanFromName(process.env.SENDGRID_FROM_NAME);

  if (!apiKey || !fromEmail) {
    console.warn(
      '[SendGrid] Thiếu SENDGRID_API_KEY hoặc SENDGRID_FROM_EMAIL trong biến môi trường.'
    );
    return {
      ok: false,
      skipped: true,
      error: 'Chưa cấu hình SENDGRID_API_KEY hoặc SENDGRID_FROM_EMAIL.',
    };
  }

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: input.to }] }],
        from: { email: fromEmail, name: fromName },
        subject: input.subject,
        content: [
          { type: 'text/plain', value: input.text },
          ...(input.html ? [{ type: 'text/html', value: input.html }] : []),
        ],
      }),
    });

    if (res.ok) {
      return { ok: true };
    }

    const errText = await res.text();
    console.error('[SendGrid] Gửi email thất bại:', res.status, errText);
    return {
      ok: false,
      error: `SendGrid lỗi (${res.status}): ${errText}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định';
    console.error('[SendGrid] Exception:', message);
    return { ok: false, error: message };
  }
}

export async function sendVerificationCodeEmail(input: {
  name: string;
  email: string;
  code: string;
}) {
  const subject = `[Mèo Cưng] Mã xác thực đăng ký tài khoản: ${input.code}`;
  const text = `Xin chào ${input.name},\n\nMã xác thực đăng ký tài khoản Mèo Cưng của bạn là: ${input.code}\n\nMã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này.\n\nTrân trọng,\nĐội ngũ Mèo Cưng`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #ffe4dc; border-radius: 16px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; background: #ff7f5c; color: #fff; font-size: 28px; width: 56px; height: 56px; line-height: 56px; border-radius: 14px;">🐱</div>
        <h2 style="color: #ff7f5c; margin: 12px 0 4px;">Xác thực tài khoản Mèo Cưng</h2>
      </div>
      <p style="color: #333; font-size: 15px;">Xin chào <strong>${escapeHtml(input.name)}</strong>,</p>
      <p style="color: #555; font-size: 14px; line-height: 1.6;">
        Vui lòng nhập mã xác thực 6 chữ số bên dưới để hoàn tất đăng ký tài khoản tại <strong>Mèo Cưng</strong>:
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ff7f5c; background: #fff4f0; border: 2px dashed #ff7f5c; padding: 14px 28px; border-radius: 12px;">
          ${input.code}
        </span>
      </div>
      <p style="color: #666; font-size: 13px; text-align: center;">
        Mã xác thực có hiệu lực trong <strong>10 phút</strong>.
      </p>
      <p style="color: #888; font-size: 12px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px;">
        Mèo Cưng Pet Shop TP.HCM • Hotline: 0382 542 737
      </p>
    </div>
  `;

  return sendEmailWithSendGrid({
    to: input.email,
    subject,
    text,
    html,
  });
}

export interface OrderEmailItem {
  name: string;
  quantity: number;
  price: number;
}

export async function sendOrderConfirmationEmail(input: {
  orderCode: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  note?: string;
  items: OrderEmailItem[];
  totalPrice: number;
  shippingFee: number;
  grandTotal: number;
}) {
  const subject = `[Mèo Cưng] Xác nhận đơn hàng #${input.orderCode} 🐱`;

  const itemsText = input.items
    .map(
      (item) =>
        `- ${item.name} x${item.quantity}: ${(item.price * item.quantity).toLocaleString('vi-VN')}₫`
    )
    .join('\n');

  const text = `Xin chào ${input.name},\n\nBạn đã đặt hàng thành công tại Mèo Cưng!\nMã đơn hàng: #${input.orderCode}\n\nSản phẩm đã đặt:\n${itemsText}\n\nTạm tính: ${input.totalPrice.toLocaleString('vi-VN')}₫\nPhí giao hàng: ${input.shippingFee === 0 ? 'Miễn phí' : `${input.shippingFee.toLocaleString('vi-VN')}₫`}\nTổng thanh toán (COD): ${input.grandTotal.toLocaleString('vi-VN')}₫\n\nThông tin giao hàng:\n- Người nhận: ${input.name}\n- SĐT: ${input.phone}\n- Địa chỉ: ${input.address}${input.note ? `\n- Ghi chú: ${input.note}` : ''}\n\nNhân viên Mèo Cưng sẽ sớm liên hệ xác nhận và giao hàng hỏa tốc trong 2H!\nHotline: 0382 542 737`;

  const itemsHtml = input.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1; color: #333; font-size: 13px;">
          ${escapeHtml(item.name)} <span style="color: #888;">× ${item.quantity}</span>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1; color: #333; font-size: 13px; text-align: right; font-weight: 600;">
          ${(item.price * item.quantity).toLocaleString('vi-VN')}₫
        </td>
      </tr>`
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #ffe4dc; border-radius: 16px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; background: #ff7f5c; color: #fff; font-size: 28px; width: 56px; height: 56px; line-height: 56px; border-radius: 14px;">🐱</div>
        <h2 style="color: #ff7f5c; margin: 12px 0 4px;">Đặt Hàng Thành Công!</h2>
        <p style="color: #666; font-size: 13px; margin: 0;">Mã đơn hàng: <strong style="color: #111;">#${input.orderCode}</strong></p>
      </div>

      <p style="color: #333; font-size: 14px;">Xin chào <strong>${escapeHtml(input.name)}</strong>,</p>
      <p style="color: #555; font-size: 14px; line-height: 1.6;">
        Cảm ơn bạn đã đặt hàng tại <strong>Mèo Cưng</strong>! Đơn hàng của bạn đã được ghi nhận và sẽ được giao hỏa tốc trong 2H tại TP.HCM.
      </p>

      <div style="background: #fff9f7; border: 1px solid #ffe4dc; border-radius: 12px; padding: 16px; margin: 18px 0;">
        <h3 style="margin: 0 0 10px; font-size: 14px; color: #ff7f5c;">Chi tiết đơn hàng</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${itemsHtml}
        </table>
        <div style="margin-top: 12px; font-size: 13px; color: #555;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Tạm tính:</span>
            <span>${input.totalPrice.toLocaleString('vi-VN')}₫</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Phí giao hàng:</span>
            <span>${input.shippingFee === 0 ? 'Miễn phí' : `${input.shippingFee.toLocaleString('vi-VN')}₫`}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; color: #ff7f5c; border-top: 1px solid #ffe4dc; padding-top: 8px;">
            <span>Tổng thanh toán (COD):</span>
            <span>${input.grandTotal.toLocaleString('vi-VN')}₫</span>
          </div>
        </div>
      </div>

      <div style="background: #f9fafb; border-radius: 12px; padding: 14px; font-size: 13px; color: #444; line-height: 1.6;">
        <div><strong>Người nhận:</strong> ${escapeHtml(input.name)}</div>
        <div><strong>Số điện thoại:</strong> ${escapeHtml(input.phone)}</div>
        <div><strong>Địa chỉ:</strong> ${escapeHtml(input.address)}</div>
        ${input.note ? `<div><strong>Ghi chú:</strong> ${escapeHtml(input.note)}</div>` : ''}
      </div>

      <p style="color: #888; font-size: 12px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px; text-align: center;">
        Mèo Cưng Pet Shop TP.HCM • Hotline: 0382 542 737
      </p>
    </div>
  `;

  return sendEmailWithSendGrid({
    to: input.email,
    subject,
    text,
    html,
  });
}

export async function sendWelcomeEmail(user: { name: string; email: string }) {
  const subject = 'Chào mừng bạn đến với Mèo Cưng 🐱';
  const text = `Xin chào ${user.name},\n\nCảm ơn bạn đã đăng ký tài khoản tại Mèo Cưng!\nChúc bạn và hoàng thượng có những trải nghiệm mua sắm thật vui vẻ.\n\nTrân trọng,\nĐội ngũ Mèo Cưng`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #ffe4dc; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; background: #ff7f5c; color: #fff; font-size: 28px; width: 56px; height: 56px; line-height: 56px; border-radius: 14px;">🐱</div>
        <h2 style="color: #ff7f5c; margin: 12px 0 4px;">Chào mừng đến với Mèo Cưng!</h2>
      </div>
      <p style="color: #333; font-size: 15px;">Xin chào <strong>${escapeHtml(user.name)}</strong>,</p>
      <p style="color: #555; font-size: 14px; line-height: 1.6;">
        Cảm ơn bạn đã đăng ký tài khoản thành viên tại <strong>Mèo Cưng</strong>.
        Từ giờ bạn có thể dễ dàng đặt mua thức ăn hạt, pate, cát vệ sinh và theo dõi ưu đãi dành riêng cho hoàng thượng.
      </p>
      <p style="color: #888; font-size: 12px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px;">
        Mèo Cưng Pet Shop TP.HCM • Hotline: 0382 542 737
      </p>
    </div>
  `;

  return sendEmailWithSendGrid({
    to: user.email,
    subject,
    text,
    html,
  });
}
