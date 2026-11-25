import type { Metadata } from "next";
import { PasswordRecoveryForm } from "@/components/auth/password-recovery-form";

export const metadata: Metadata = { title: "Khôi phục mật khẩu" };

export default async function PasswordRecoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return <PasswordRecoveryForm token={typeof token === "string" ? token : undefined} />;
}
