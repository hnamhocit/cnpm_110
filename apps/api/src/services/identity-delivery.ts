import nodemailer from "nodemailer";
import { AppError } from "../utils/errors";

export interface IdentityDelivery {
  emailCode(to: string, code: string): Promise<void>;
  startPhoneVerification(to: string): Promise<void>;
  checkPhoneVerification(to: string, code: string): Promise<boolean>;
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

async function requestVerification(
  endpoint: "Verifications" | "VerificationCheck",
  parameters: Record<string, string>,
): Promise<string | undefined> {
  const { TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, TWILIO_VERIFY_SERVICE_SID } = Bun.env;
  if (!TWILIO_API_KEY_SID || !TWILIO_API_KEY_SECRET ||
      !TWILIO_VERIFY_SERVICE_SID || !/^VA[0-9a-f]{32}$/i.test(TWILIO_VERIFY_SERVICE_SID)) {
    throw new AppError("SMS verification is temporarily unavailable", 503);
  }
  try {
    const credentials = Buffer.from(`${TWILIO_API_KEY_SID}:${TWILIO_API_KEY_SECRET}`).toString("base64");
    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/${endpoint}`,
      {
        method: "POST",
        headers: { Authorization: `Basic ${credentials}` },
        body: new URLSearchParams(parameters),
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (endpoint === "VerificationCheck" && [404, 429].includes(response.status)) {
      await response.body?.cancel();
      return undefined;
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error("Twilio Verify rejected the request");
    }
    const result = await response.json() as { status?: string };
    return result.status;
  } catch {
    throw new AppError("SMS verification is temporarily unavailable", 503);
  }
}

export const identityDelivery: IdentityDelivery = {
  emailCode(to, code) {
    return sendEmail(to, "Film Contest · Xác thực email",
      `Mã xác thực Film Contest của bạn là ${code}. Mã có hiệu lực trong 15 phút.`);
  },
  async startPhoneVerification(to) {
    const status = await requestVerification("Verifications", { To: to, Channel: "sms" });
    if (status !== "pending") throw new AppError("SMS delivery is temporarily unavailable", 503);
  },
  async checkPhoneVerification(to, code) {
    return await requestVerification("VerificationCheck", { To: to, Code: code }) === "approved";
  },
  async passwordReset(to, token) {
    const resetPage = Bun.env.PASSWORD_RESET_URL;
    if (!resetPage || !URL.canParse(resetPage) || new URL(resetPage).protocol !== "https:") {
      throw new AppError("Password recovery is temporarily unavailable", 503);
    }
    const url = new URL(resetPage);
    url.searchParams.set("token", token);
    await sendEmail(to, "Film Contest · Đặt lại mật khẩu",
      `Mở liên kết sau để đặt lại mật khẩu Film Contest. Liên kết có hiệu lực trong 15 phút.\n${url.href}`);
  },
};
