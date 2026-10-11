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

const MIN_PASSWORD_LENGTH = 8;

export function RegisterForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  function validate() {
    if (!fullName.trim() || !email.trim() || !organization.trim()) {
      return "Điền đủ họ tên, email và tên tổ chức.";
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
    }
    if (password !== confirmPassword) {
      return "Mật khẩu xác nhận chưa khớp.";
    }
    return "";
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = validate();
    setError(message);
    if (message) return;

    // TODO(FPC-16): gọi API đăng ký qua HTTP client sau khi client được merge.
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} noValidate>
        <CardHeader>
          <CardTitle className="text-xl">Tạo tài khoản</CardTitle>
          <CardDescription>
            Đăng ký để tổ chức và quản lý cuộc thi nhiếp ảnh phim.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 py-6">
          <AuthField
            id="fullName"
            label="Họ và tên"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
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
            id="organization"
            label="Tên tổ chức"
            autoComplete="organization"
            placeholder="Câu lạc bộ, trường hoặc lab phim"
            value={organization}
            onChange={(event) => setOrganization(event.target.value)}
          />
          <AuthField
            id="password"
            label="Mật khẩu"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <AuthField
            id="confirmPassword"
            label="Xác nhận mật khẩu"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full">
            Tạo tài khoản
          </Button>
        </CardContent>

        <CardFooter className="justify-center text-sm text-muted-foreground">
          Đã có tài khoản?&nbsp;
          <Link href="/login" className="font-medium text-foreground underline">
            Đăng nhập
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
