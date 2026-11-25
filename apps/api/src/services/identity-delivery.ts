import nodemailer from "nodemailer";
import { AppError } from "../utils/errors";

export interface IdentityDelivery {
  emailCode(to: string, code: string): Promise<void>;
  passwordReset(to: string, token: string): Promise<void>;
}

async function sendEmail(to: string, subject: string, message: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = Bun.env;
  const port = Number(SMTP_PORT || 587);
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM) {
    throw new AppError("Email service is temporarily unavailable", 503);
  }
  try {
    await nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
      connectionTimeout: 5_000,
      greetingTimeout: 5_000,
      socketTimeout: 10_000,
    }).sendMail({ from: SMTP_FROM, to, subject, text: message });
  } catch {
    throw new AppError("Email delivery is temporarily unavailable", 503);
  }
}

export const identityDelivery: IdentityDelivery = {
  emailCode(to, code) {
    return sendEmail(to, "CINEGEN · Xác thực email",
      `Mã xác thực CINEGEN của bạn là ${code}. Mã có hiệu lực trong 15 phút.`);
  },
  async passwordReset(to, token) {
    const resetPage = Bun.env.PASSWORD_RESET_URL;
    if (!resetPage || !URL.canParse(resetPage) || new URL(resetPage).protocol !== "https:") {
      throw new AppError("Password recovery is temporarily unavailable", 503);
    }
    const url = new URL(resetPage);
    url.searchParams.set("token", token);
    await sendEmail(to, "CINEGEN · Đặt lại mật khẩu",
      `Mở liên kết sau để đặt lại mật khẩu CINEGEN. Liên kết có hiệu lực trong 15 phút.\n${url.href}`);
  },
};
