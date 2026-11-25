import Link from "next/link";
import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function LoginPage() {
  return (
    <div className="w-full space-y-4">
      <LoginForm />
      <Link href="/auth/reset-password" className="block text-center text-sm text-brand-solid">
        Quên mật khẩu?
      </Link>
    </div>
  );
}
