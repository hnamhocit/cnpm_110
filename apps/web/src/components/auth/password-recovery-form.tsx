"use client";

import { isAxiosError } from "axios";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { http } from "@/lib/http";

export function PasswordRecoveryForm({ token }: { token?: string }) {
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError("");
    try {
      if (token) {
        await http.post("/api/v1/auth/reset-password", {
          token,
          newPassword: form.get("newPassword"),
          confirmPassword: form.get("confirmPassword"),
        });
        setResult("Mật khẩu đã được đặt lại. Bạn có thể đăng nhập.");
      } else {
        await http.post("/api/v1/auth/forgot-password", { email: form.get("email") });
        setResult("Nếu email đã được xác minh, hệ thống sẽ gửi liên kết đặt lại mật khẩu.");
      }
    } catch (err) {
      const message = isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : undefined;
      setError(message ?? "Không thể thực hiện yêu cầu. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full rounded-2xl border p-7 sm:p-9">
      <h1 className="text-2xl font-bold">{token ? "Đặt lại mật khẩu" : "Khôi phục mật khẩu"}</h1>
      {result ? (
        <p role="status">{result}</p>
      ) : (
        <form className="space-y-4" onSubmit={submit}>
          {token ? (
            <>
              <AuthField id="newPassword" label="Mật khẩu mới" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
              <AuthField id="confirmPassword" label="Xác nhận mật khẩu" type="password" autoComplete="new-password" required />
            </>
          ) : (
            <AuthField id="email" label="Email đã xác minh" type="email" autoComplete="email" required />
          )}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" disabled={submitting} type="submit">
            {token ? "Đặt lại mật khẩu" : "Gửi liên kết"}
          </Button>
        </form>
      )}
      <Link href="/login" className="text-sm font-semibold text-brand-solid">Về trang đăng nhập</Link>
    </Card>
  );
}
