"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Role } from "@/lib/route-access";
import { useAuthStore } from "@/lib/stores/auth-store";

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
      // BFF set cookie HttpOnly cho refreshToken, chỉ trả accessToken về memory.
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        accessToken?: string;
        error?: string;
        user?: { role?: Role };
      };

      if (!response.ok || !data.accessToken) {
        throw new Error(
          data.error ??
            "Đăng nhập thất bại. Vui lòng kiểm tra lại email/mật khẩu!",
        );
      }

      useAuthStore
        .getState()
        .setTokens({ accessToken: data.accessToken, role: data.user?.role });

      router.push("/portal");
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
    <Card>
      <form onSubmit={handleSubmit} noValidate>
        <CardHeader>
          <CardTitle className="text-xl">Đăng nhập</CardTitle>
          <CardDescription>
            Dành cho Admin và Organizer của cuộc thi nhiếp ảnh phim.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 py-6">
          <AuthField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="ban@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <AuthField
            id="password"
            label="Mật khẩu"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {error ? (
            <p role="alert" className="text-sm text-destructive font-medium">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </CardContent>

        <CardFooter className="justify-center text-sm text-muted-foreground">
          Chưa có tài khoản?&nbsp;
          <Link
            href="/register"
            className="font-medium text-foreground underline"
          >
            Tạo tài khoản
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
