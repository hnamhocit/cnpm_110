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
import { http } from "@/lib/http"; // Import Axios client

const MIN_PASSWORD_LENGTH = 8;

export function RegisterForm() {
  const router = useRouter();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  // Đã xóa state organization
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Trạng thái đang gửi API

  function validate() {
    // Đã xóa điều kiện check organization
    if (!fullName.trim() || !email.trim()) {
      return "Vui lòng điền đủ họ tên và email.";
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
    }
    if (password !== confirmPassword) {
      return "Mật khẩu xác nhận chưa khớp.";
    }
    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); // Xóa lỗi cũ

    const message = validate();
    if (message) {
      setError(message);
      return;
    }

    setIsLoading(true);

    try {
      // Gọi API đăng ký theo đúng tài liệu của PM
      await http.post('/api/v1/auth/register', {
        fullName: fullName.trim(),
        email: email.trim(),
        password: password,
        role: 'ORGANIZER' // Bắt buộc phải có theo tài liệu
      });

      alert("Đăng ký thành công! Vui lòng đăng nhập.");
      router.push("/login"); // Chuyển hướng sang trang đăng nhập
      
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        "Đăng ký thất bại. Email có thể đã tồn tại hoặc lỗi kết nối!"
      );
    } finally {
      setIsLoading(false);
    }
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
          
          {/* ĐÃ XÓA HOÀN TOÀN Ô "TÊN TỔ CHỨC" Ở ĐÂY */}

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
            <p role="alert" className="text-sm text-destructive font-medium">
              {error}
            </p>
          ) : null}

          {/* Cập nhật nút bấm để hiển thị trạng thái Loading */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
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