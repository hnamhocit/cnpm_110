"use client";

import axios from "axios";
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

<<<<<<< Updated upstream
=======
    try {
      const res = await http.post("/api/v1/auth/login", {
        email: email.trim(),
        password: password,
      });

      const data = res.data.data;

      useAuthStore.getState().setTokens({
        accessToken: data.accessToken,
        role: data.user?.role || "Organizer",
      });

      router.push("/portal");
    } catch (err: unknown) {
      console.error(err);
      let errorMessage =
        "Đăng nhập thất bại. Vui lòng kiểm tra lại email/mật khẩu!";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
            <p role="alert" className="text-sm text-destructive">
=======
            <output
              role="alert"
              className="block text-sm text-destructive font-medium"
            >
>>>>>>> Stashed changes
              {error}
            </output>
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
