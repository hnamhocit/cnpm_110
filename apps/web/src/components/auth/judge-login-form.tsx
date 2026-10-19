"use client";

import axios from "axios";
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
import { http } from "@/lib/http";
import { useAuthStore } from "@/lib/stores/auth-store";

export function JudgeLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState("");

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
      const res = await http.post("/api/v1/auth/login", {
        email: email.trim(),
        password: password,
      });

      const data = res.data.data;

      if (data.user?.role !== "Judge") {
        setError(
          "Tài khoản của bạn không có quyền truy cập với tư cách Giám khảo.",
        );
        return;
      }

      useAuthStore.getState().setTokens({
        accessToken: data.accessToken,
        role: "Judge",
      });

      router.push("/portal");
    } catch (err: unknown) {
      console.error(err);
      let errorMessage = "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} noValidate>
        <CardHeader>
          <CardTitle className="text-xl">Đăng nhập Giám khảo</CardTitle>
          <CardDescription>
            Dành riêng cho Ban giám khảo của cuộc thi nhiếp ảnh phim.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 py-6">
          <AuthField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="judge@example.com"
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
            <output
              role="alert"
              className="block text-sm text-destructive font-medium"
            >
              {error}
            </output>
          ) : null}

          {notice ? (
            <output className="block text-sm text-muted-foreground">
              {notice}
            </output>
          ) : null}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Đang xác thực..." : "Đăng nhập"}
          </Button>
        </CardContent>

        <CardFooter className="justify-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-foreground underline">
            Quay lại trang Đăng nhập chung
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
