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
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function request(action: "register" | "verify-email" | "resend-verification") {
    setError("");
    if (action === "resend-verification" && (!email.trim() || !password)) {
      setError("Nhập email và mật khẩu đã dùng khi đăng ký.");
      return;
    }
    setNotice("");
    setIsLoading(true);
    try {
      const identity = { email: email.trim() };
      if (action === "verify-email") {
        await http.post("/api/v1/auth/verify-email", { ...identity, code: code.trim() });
        router.push("/login");
        return;
      }
      const payload = action === "register"
        ? { ...identity, password, fullName: fullName.trim() }
        : { ...identity, password };
      const response = await http.post<{ data: { deliveryStatus: string } }>(
        `/api/v1/auth/${action}`, payload,
      );
      setVerifying(true);
      setNotice(response.data.data.deliveryStatus === "RETRY_REQUIRED"
        ? "Chưa gửi được mã. Vui lòng thử gửi lại sau."
        : "Kiểm tra hộp thư email để lấy mã xác thực.");
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string; message?: string } } };
      const data = apiErr.response?.data;
      setError(data?.message ?? data?.error ?? "Không thể hoàn tất yêu cầu. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (verifying) {
      if (!/^\d{6}$/.test(code.trim())) {
        setError("Nhập mã xác thực gồm 6 chữ số.");
        return;
      }
      void request("verify-email");
      return;
    }

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

    void request("register");
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
            {verifying ? "Xác thực email" : "Tạo tài khoản"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {verifying ? email.trim() : "Đăng ký để bắt đầu với CINEGEN"}
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
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          ) : (
            <>
                <AuthField
                  id="fullName"
                  label="Họ và tên"
                  labelClassName={fieldLabelClassName}
                  className={fieldInputClassName}
                  type="text"
                  autoComplete="name"
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
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
            </>
          )}
          {notice ? <p role="status" className="text-sm">{notice}</p> : null}

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
            {isLoading ? "Đang xử lý..." : verifying ? "Xác thực email" : "Tạo tài khoản"}
          </Button>

          {verifying && (
            <Button type="button" variant="outline" disabled={isLoading} onClick={() => void request("resend-verification")}>
              Gửi lại mã
            </Button>
          )}
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
