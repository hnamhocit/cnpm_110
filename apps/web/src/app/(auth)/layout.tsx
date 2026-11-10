import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4f7ff] px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[220px] -left-[180px] size-[560px] rounded-full bg-blue-100/[0.65]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[160px] -bottom-[200px] size-[520px] rounded-full bg-blue-100/[0.55]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[120px] right-[20px] size-[240px] rounded-full bg-blue-100/[0.5]"
      />

      <div className="relative z-10 w-full max-w-[440px]">{children}</div>
    </main>
  );
}
