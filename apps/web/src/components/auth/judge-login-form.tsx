
"use client";

import { type FormEvent, useState } from "react";

import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function JudgeLoginForm() {
  const [credential, setCredential] = useState("");
  const [loginMethod, setLoginMethod] = useState<"email" | "invite">("email");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");



function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  const input = credential.trim();
  setNotice("");

  // 1. Kiểm tra bỏ trống
  if (!input) {
    setError(
      loginMethod === "email"
        ? "Please enter your email."
        : "Please enter your invitation code."
    );
    return;
  }

  // 2. Nếu đăng nhập bằng Email
  if (loginMethod === "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(input)) {
      setError("Please enter the correct mail.");
      return;
    }
  }

  // 3. Nếu đăng nhập bằng Invitation Code
  if (loginMethod === "invite") {
    // Ví dụ định dạng: JUDGE-2026-ABC
    const codeRegex = /^JUDGE-\d{4}-[A-Z0-9]{3,}$/;

    if (!codeRegex.test(input)) {
      setError("Please enter the correct code.");
      return;
    }
  }

  // 4. Dữ liệu đạt kiểm tra định dạng
  setError("");
  setNotice("Login API is not connected yet.");
}



  return (
    <Card className="mx-auto w-full max-w-md">
      <form onSubmit={handleSubmit} noValidate>
        <CardHeader>
          <CardTitle className="text-xl">
            Login as a Judge
          </CardTitle>
        </CardHeader>
<CardContent className="flex flex-col gap-4 py-6">
<div className="grid grid-cols-2 gap-2">
 <Button
    type="button"
    variant={loginMethod === "email" ? "default" : "outline"}
    onClick={() => {
      setLoginMethod("email");
      setCredential("");
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
      setError("");
      setNotice("");
    }}
  >
    Invitation Code
  </Button>
</div>

          <AuthField
            id="judge-credential"
            label={loginMethod === "email" ? "Email address" : "Invitation code"}
type={loginMethod === "email" ? "email" : "text"}
placeholder={
  loginMethod === "email"
    ? "judge@example.com"
    : "Enter your invitation code"
}
            value={credential}
            onChange={(event) => {
              setCredential(event.target.value);
              setError("");
              setNotice("");
            }}
          />

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          {notice && (
            <p role="status" className="text-sm text-muted-foreground">
              {notice}
            </p>
          )}

          <Button type="submit" className="w-full">
            Login
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            This feature is under development.
            Please contact the contest organizer for access.
          </p>
        </CardContent>
      </form>
    </Card>
  );
}
