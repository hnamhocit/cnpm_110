"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { AuthField } from "@/components/auth/auth-field";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { http } from "@/lib/http";
import { useAuthStore } from "@/lib/stores/auth-store";

type LoginResponse = {
  accessToken?: string;
  emailVerificationRequired?: boolean;
  user?: {
    role: "Admin" | "Organizer" | "Judge" | "Participant";
  };
  error?: string;
};

const fieldLabelClassName = "text-xs font-semibold text-foreground";

const fieldInputClassName =
  "h-11 rounded-xl border-input bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/20 transition-all";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function resendCode() {
    setIsLoading(true);
    setNotice("");
    setError("");
    try {
      const { data } = await http.post<{ data: { deliveryStatus: string } }>(
        "/api/v1/auth/resend-verification",
        { email: email.trim(), password },
      );
      setNotice(data.data.deliveryStatus === "RETRY_REQUIRED"
        ? "Chưa gửi được mã. Vui lòng thử lại sau."
        : "Kiểm tra hộp thư để nhận mã xác thực.");
    } catch {
      setError("Chưa gửi được mã. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!email.trim() || !password) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    setIsLoading(true);

    try {
      if (verifying) {
        try {
          await http.post("/api/v1/auth/verify-email", { email: email.trim(), code: code.trim() });
        } catch {
          setError("Không thể xác thực email. Kiểm tra mã hoặc yêu cầu gửi lại.");
          return;
        }
        setVerifying(false);
        setCode("");
      }
      // BFF set cookie HttpOnly (refresh token) và trả access token cho memory.
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await response.json().catch(() => ({}))) as LoginResponse;

      if (data.emailVerificationRequired) {
        setVerifying(true);
        return;
      }

      if (!response.ok || !data.accessToken) {
        throw new Error(
          data.error ??
            "Đăng nhập thất bại. Vui lòng kiểm tra lại email/mật khẩu!",
        );
      }

      const userRole = data.user?.role || "Participant";
      useAuthStore.getState().setTokens({
        accessToken: data.accessToken,
        role: userRole,
      });

      // Tạo cookie session để Server Components đọc được trực tiếp
      // biome-ignore lint/suspicious/noDocumentCookie: Required for SSR auth in Next.js App Router
      document.cookie = `access_token=${data.accessToken}; path=/; max-age=86400; SameSite=Lax`;

      if (userRole === "Admin" || userRole === "Organizer") {
        window.location.href = "/portal";
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đăng nhập thất bại. Vui lòng kiểm tra lại email/mật khẩu!",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full gap-0 rounded-2xl border border-border bg-card p-7 sm:p-9 shadow-xl shadow-brand-solid/5 ring-0">
      <form
        className="flex flex-col items-center gap-6"
        onSubmit={handleSubmit}
      >
        <Link
          href="/"
          title="Quay lại trang chủ"
          className="group rounded-2xl p-1 transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BrandMark size={56} className="shrink-0 rounded-2xl shadow-sm" />
        </Link>

        <header className="flex w-full flex-col items-center gap-1.5 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {verifying ? "Xác thực email" : "Đăng nhập"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {verifying
              ? `Nhập mã xác thực cho ${email.trim()}.`
              : "Chào mừng bạn trở lại với CINEGEN"}
          </p>
        </header>

        <div className="flex w-full flex-col gap-4">
          {verifying ? (
            <AuthField
              id="emailCode"
              label="Mã xác thực email"
              labelClassName={fieldLabelClassName}
              className={fieldInputClassName}
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          ) : (
            <>
              <AuthField
                id="email"
                label="Email"
                labelClassName={fieldLabelClassName}
                className={fieldInputClassName}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <AuthField
                id="password"
                label="Mật khẩu"
                labelClassName={fieldLabelClassName}
                className={fieldInputClassName}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </>
          )}
          {notice && <p role="status" className="text-sm">{notice}</p>}

          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs font-medium text-destructive"
            >
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex w-full flex-col items-center gap-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="h-11 w-full rounded-xl bg-brand-solid text-sm font-semibold text-white shadow-md shadow-brand-solid/20 hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 transition-all active:scale-[0.99]"
          >
            {isLoading ? "Đang xử lý…" : verifying ? "Xác thực và đăng nhập" : "Đăng nhập"}
          </Button>

          {verifying ? (
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" variant="outline" disabled={isLoading} onClick={() => void resendCode()}>
                Gửi lại mã
              </Button>
              <Button type="button" variant="ghost" disabled={isLoading} onClick={() => {
                setVerifying(false);
                setCode("");
                setError("");
                setNotice("");
              }}>
                Quay lại đăng nhập
              </Button>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link
                href="/register"
                className="font-semibold text-brand-solid transition-colors hover:text-brand-hover"
              >
                Tạo tài khoản
              </Link>
            </p>
          )}
        </div>
      </form>
    </Card>
  );
}
