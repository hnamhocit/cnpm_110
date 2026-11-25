"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/lib/stores/auth-store";
import { BrandMark } from "@/components/brand-mark";

type LoginResponse = {
  accessToken?: string;
  user?: {
    role: "Admin" | "Organizer" | "Judge" | "Participant";
  };
  error?: string;
};

const fieldLabelClassName = "text-sm font-medium text-slate-700";

const fieldInputClassName =
  "h-12 rounded-[10px] border-slate-300 bg-white px-4 text-[15px] leading-[22px] text-slate-900 placeholder:text-slate-400 focus-visible:border-brand-ring focus-visible:ring-brand-ring/20 md:text-[15px]";

export function LoginForm() {
  const router = useRouter();
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
    <Card className="w-full gap-0 rounded-[20px] border border-slate-200 bg-white py-0 shadow-[0_2px_8px_0_rgba(15,23,42,0.06),0_24px_64px_-24px_rgba(30,58,138,0.10)] ring-0">
      <form
        className="flex flex-col items-center gap-7 p-10"
        onSubmit={handleSubmit}
        noValidate
      >
        <BrandMark size={56} className="shrink-0 rounded-2xl" />

        <header className="flex w-full flex-col items-center gap-2 text-center">
          <h1 className="text-[32px] leading-10 font-semibold tracking-[-0.01em] text-slate-900">
            Đăng nhập
          </h1>
          <p className="text-[15px] leading-[22px] text-slate-500">
            Chào mừng bạn trở lại với CINEGEN
          </p>
        </header>

        <div className="flex w-full flex-col gap-5">
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
            <p role="alert" className="text-sm font-medium text-red-600">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex w-full flex-col items-center gap-6">
          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-[10px] bg-brand-solid text-base font-semibold text-white shadow-md shadow-brand-solid/25 hover:bg-brand-hover focus-visible:border-brand-ring focus-visible:ring-brand-ring/30 disabled:opacity-60"
          >
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>

          <p className="text-sm leading-5 text-slate-500">
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
