"use client";

import Link from "next/link";
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

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Nhập email và mật khẩu để đăng nhập.");
      return;
    }

    setError("");
    // TODO(FPC-16): gọi API đăng nhập qua HTTP client sau khi client được merge.
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
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full">
            Đăng nhập
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
