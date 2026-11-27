import { env } from "../config/env";
import nodemailer from "nodemailer";
import { AppError } from "../utils/errors";

export interface IdentityDelivery {
  emailCode(to: string, code: string): Promise<void>;
  passwordReset(to: string, token: string): Promise<void>;
}

export async function sendEmail(to: string, subject: string, message: string) {
  const port = env.smtpPort;
  try {
    await nodemailer.createTransport({
      host: env.smtpHost,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user: env.smtpUser, pass: env.smtpPassword },
      connectionTimeout: 5_000,
      greetingTimeout: 5_000,
      socketTimeout: 10_000,
    }).sendMail({ from: env.smtpFrom, to, subject, text: message });
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
    const resetPage = env.passwordResetUrl;
    const url = resetPage ? URL.parse(resetPage) : null;
    const isLocalDevelopment = env.nodeEnv !== "production" &&
      url?.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (!url || (url.protocol !== "https:" && !isLocalDevelopment)) {
      throw new AppError("Password recovery is temporarily unavailable", 503);
    }
    url.searchParams.set("token", token);
    await sendEmail(to, "CINEGEN · Đặt lại mật khẩu",
      `Mở liên kết sau để đặt lại mật khẩu CINEGEN. Liên kết có hiệu lực trong 15 phút.\n${url.href}`);
  },
};
