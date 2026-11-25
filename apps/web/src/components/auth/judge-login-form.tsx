"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { normalizeRole } from "@/lib/route-access";
import { useAuthStore } from "@/lib/stores/auth-store";

export function JudgeLoginForm() {
  const router = useRouter();
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [loginMethod, setLoginMethod] = useState<"email" | "invite">("email");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const input = credential.trim();
    setNotice("");
    setError("");

    // 1. Kiểm tra bỏ trống
    if (!input) {
      setError(
        loginMethod === "email"
          ? "Vui lòng nhập địa chỉ email của bạn."
          : "Vui lòng nhập mã thư mời giám khảo.",
      );
      return;
    }

    if (!password) {
      setError("Vui lòng nhập mật khẩu tài khoản giám khảo.");
      return;
    }

    // 2. Nếu đăng nhập bằng Email
    if (loginMethod === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input)) {
        setError("Địa chỉ email không đúng định dạng.");
        return;
      }
    }

    // 3. Invitation code login chưa có endpoint backend (UC-29 mới ở mức thiết kế).
    if (loginMethod === "invite") {
      const codeRegex = /^JUDGE-\d{4}-[A-Z0-9]{3,}$/i;
      if (!codeRegex.test(input)) {
        setError("Mã thư mời không đúng định dạng (VD: JUDGE-2026-ABC).");
        return;
      }
      setError(
        "Đăng nhập bằng mã thư mời chưa được hỗ trợ. Vui lòng dùng email giám khảo.",
      );
      return;
    }

    setIsLoading(true);
    try {
      // Dùng chung BFF: refreshToken vào cookie HttpOnly, accessToken về memory.
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: input, password }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        accessToken?: string;
        user?: { role?: string };
        error?: string;
      };

      if (!response.ok || !data.accessToken) {
        throw new Error(
          data.error ?? "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!",
        );
      }

      if (normalizeRole(data.user?.role ?? null) !== "Judge") {
        await fetch("/api/v1/auth/logout", { method: "POST" });
        useAuthStore.getState().clear();
        throw new Error("Tài khoản này không có quyền giám khảo.");
      }

      useAuthStore
        .getState()
        .setTokens({ accessToken: data.accessToken, role: "Judge" });

      // Không ghi access_token bằng document.cookie: BFF đã set cookie HttpOnly.
      // Không gian chấm thi riêng (UC-29..33) chưa được triển khai nên về trang chủ.
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <form onSubmit={handleSubmit} noValidate>
        <CardHeader>
          <CardTitle className="text-xl">Đăng nhập Ban Giám khảo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 py-6">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={loginMethod === "email" ? "default" : "outline"}
              onClick={() => {
                setLoginMethod("email");
                setCredential("");
                setPassword("");
                setError("");
                setNotice("");
              }}
            >
              Email
            </Button>

            <Button
              type="button"
              variant={loginMethod === "invite" ? "default" : "outline"}
              onClick={() => {
                setLoginMethod("invite");
                setCredential("");
                setPassword("");
                setError("");
                setNotice("");
              }}
            >
              Mã thư mời
            </Button>
          </div>

          <AuthField
            id="judge-credential"
            label={loginMethod === "email" ? "Địa chỉ Email" : "Mã thư mời"}
            type={loginMethod === "email" ? "email" : "text"}
            placeholder={
              loginMethod === "email"
                ? "judge@analogphotography.vn"
                : "JUDGE-2026-ABC"
            }
            value={credential}
            onChange={(event) => {
              setCredential(event.target.value);
              setError("");
              setNotice("");
            }}
          />

          <AuthField
            id="judge-password"
            label="Mật khẩu"
            type="password"
            placeholder="Nhập mật khẩu của bạn"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
          />

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          {notice && (
            <output className="block text-sm text-muted-foreground">
              {notice}
            </output>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Đang xử lý đăng nhập..." : "Đăng nhập chấm thi"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Không gian chấm thi bảo mật ẩn danh kép (Double-Blind BR-12).
          </p>
        </CardContent>
      </form>
    </Card>
  );
}
