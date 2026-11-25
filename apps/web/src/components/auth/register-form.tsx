"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { AuthField } from "@/components/auth/auth-field";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { http } from "@/lib/http";

const fieldLabelClassName = "text-xs font-semibold text-foreground";

const fieldInputClassName =
  "h-11 rounded-xl border-input bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/20 transition-all";

const MIN_PASSWORD_LENGTH = 8;

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`);
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsLoading(true);

    try {
      await http.post("/api/v1/auth/register", {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });

      router.push("/login");
    } catch (err: unknown) {
      console.error(err);
      const apiErr = err as {
        response?: { data?: { error?: string; message?: string } };
      };
      const data = apiErr.response?.data;
      setError(
        data?.error ??
          data?.message ??
          "Đăng ký thất bại. Email có thể đã tồn tại hoặc lỗi kết nối!",
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
            Tạo tài khoản
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Đăng ký để bắt đầu với CINEGEN
          </p>
        </header>

        <div className="flex w-full flex-col gap-4">
          <AuthField
            id="fullName"
            label="Họ và tên"
            labelClassName={fieldLabelClassName}
            className={fieldInputClassName}
            type="text"
            autoComplete="name"
            placeholder="Nguyễn Văn A"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
          <AuthField
            id="email"
            label="Email"
            labelClassName={fieldLabelClassName}
            className={fieldInputClassName}
            type="email"
            autoComplete="email"
            placeholder="ban@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <AuthField
            id="password"
            label="Mật khẩu"
            labelClassName={fieldLabelClassName}
            className={fieldInputClassName}
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <AuthField
            id="confirmPassword"
            label="Xác nhận mật khẩu"
            labelClassName={fieldLabelClassName}
            className={fieldInputClassName}
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
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
            {isLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </Button>

          <p className="text-xs sm:text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link
              href="/login"
              className="font-semibold text-brand-solid transition-colors hover:text-brand-hover"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </form>
    </Card>
  );
}
