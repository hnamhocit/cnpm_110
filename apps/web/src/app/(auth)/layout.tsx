import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-brand-canvas px-4 py-8 sm:py-12">
      {/* Ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 -left-40 size-[520px] rounded-full bg-brand-soft/80 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-36 -bottom-48 size-[500px] rounded-full bg-brand-glow/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/4 right-10 size-[280px] rounded-full bg-brand-soft/50 blur-2xl"
      />

      {/* Top Floating Navigation */}
      <div className="absolute top-4 sm:top-6 left-4 sm:left-8 z-20">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-md transition-all hover:border-brand-glow hover:bg-background hover:text-foreground shadow-2xs"
        >
          <ArrowLeft className="size-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span>Quay lại trang chủ</span>
        </Link>
      </div>

      {/* Auth Card Container */}
      <div className="relative z-10 w-full max-w-[440px] pt-8 sm:pt-0">
        {children}
      </div>
    </main>
  );
}
