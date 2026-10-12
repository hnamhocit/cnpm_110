import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Tạo tài khoản" };

export default function RegisterPage() {
  return <RegisterForm />;
}
