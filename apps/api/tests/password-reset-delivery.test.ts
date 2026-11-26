import { expect, mock, spyOn, test } from "bun:test";
import nodemailer from "nodemailer";
import { identityDelivery } from "../src/services/identity-delivery";

test("password reset accepts local HTTP only outside production", async () => {
  const config = {
    NODE_ENV: "development",
    PASSWORD_RESET_URL: "http://localhost:3000/auth/reset-password",
    SMTP_HOST: "smtp.example.test",
    SMTP_USER: "test",
    SMTP_PASSWORD: "test",
    SMTP_FROM: "test@example.test",
  };
  const previous = Object.keys(config).map((key) => [key, Bun.env[key]] as const);
  const sendMail = mock(async (_message: { text: string }) => {});
  const transport = spyOn(nodemailer, "createTransport")
    .mockReturnValue({ sendMail } as unknown as ReturnType<typeof nodemailer.createTransport>);

  try {
    Object.assign(Bun.env, config);
    await identityDelivery.passwordReset("participant@example.test", "test-token");
    expect(sendMail.mock.calls[0]?.[0].text)
      .toContain("http://localhost:3000/auth/reset-password?token=test-token");

    Bun.env.PASSWORD_RESET_URL = "http://cinegen.example/auth/reset-password";
    await expect(identityDelivery.passwordReset("participant@example.test", "test-token"))
      .rejects.toThrow("Password recovery is temporarily unavailable");

    Bun.env.NODE_ENV = "production";
    Bun.env.PASSWORD_RESET_URL = config.PASSWORD_RESET_URL;
    await expect(identityDelivery.passwordReset("participant@example.test", "test-token"))
      .rejects.toThrow("Password recovery is temporarily unavailable");
    expect(sendMail).toHaveBeenCalledTimes(1);
  } finally {
    transport.mockRestore();
    for (const [key, value] of previous) {
      if (value === undefined) delete Bun.env[key];
      else Bun.env[key] = value;
    }
  }
});
