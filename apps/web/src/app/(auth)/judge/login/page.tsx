import type { Metadata } from "next";

import { JudgeLoginForm } from "@/components/auth/judge-login-form";

export const metadata: Metadata = {
  title: "Judge Login",
};

export default function JudgeLoginPage() {
  return <JudgeLoginForm />;
}
