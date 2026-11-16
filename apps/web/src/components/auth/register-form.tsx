"use client";

import { Aperture } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { http } from "@/lib/http";

const fieldLabelClassName = "text-sm font-medium text-slate-700";

const fieldInputClassName =
  "h-12 rounded-[10px] border-slate-300 bg-white px-4 text-[15px] leading-[22px] text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 md:text-[15px]";

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
    <Card className="w-full gap-0 rounded-[20px] border border-slate-200 bg-white py-0 shadow-[0_2px_8px_0_rgba(15,23,42,0.06),0_24px_64px_-24px_rgba(30,58,138,0.10)] ring-0">
      <form
        className="flex flex-col items-center gap-7 p-10"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.30)]">
          <Aperture aria-hidden="true" className="size-7" strokeWidth={2} />
        </div>

        <header className="flex w-full flex-col items-center gap-2 text-center">
          <h1 className="text-[32px] leading-10 font-semibold tracking-[-0.01em] text-slate-900">
            Tạo tài khoản
          </h1>
          <p className="text-[15px] leading-[22px] text-slate-500">
            Đăng ký để bắt đầu với Film Contest
          </p>
        </header>

        <div className="flex w-full flex-col gap-5">
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
            <p role="alert" className="text-sm font-medium text-red-600">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex w-full flex-col items-center gap-6">
          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-[10px] bg-blue-600 text-base font-semibold text-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.30)] hover:bg-blue-700 focus-visible:border-blue-500 focus-visible:ring-blue-500/30 disabled:opacity-60"
          >
            {isLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </Button>

          <p className="text-sm leading-5 text-slate-500">
            Đã có tài khoản?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 transition-colors hover:text-blue-700"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </form>
    </Card>
  );
}
