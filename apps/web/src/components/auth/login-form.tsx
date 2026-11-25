"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { AuthField } from "@/components/auth/auth-field";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/lib/stores/auth-store";

type LoginResponse = {
  accessToken?: string;
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
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    setIsLoading(true);

    try {
      // BFF set cookie HttpOnly (refresh token) và trả access token cho memory.
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await response.json().catch(() => ({}))) as LoginResponse;

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
        noValidate
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
            Đăng nhập
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Chào mừng bạn trở lại với CINEGEN
          </p>
        </header>

        <div className="flex w-full flex-col gap-4">
          <AuthField
            id="email"
            label="Email"
            labelClassName={fieldLabelClassName}
            className={fieldInputClassName}
            type="email"
            autoComplete="email"
            placeholder="organizer.test@example.com"
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
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

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
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>

          <p className="text-xs sm:text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link
              href="/register"
              className="font-semibold text-brand-solid transition-colors hover:text-brand-hover"
            >
              Tạo tài khoản
            </Link>
          </p>
        </div>
      </form>
    </Card>
  );
}
