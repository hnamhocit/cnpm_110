import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] flex-col justify-between overflow-hidden bg-brand-ink text-white">
      {/* Full-bleed Editorial Film Background */}
      <Image
        src="/images/hero-film.jpg"
        alt="Máy ảnh phim 35mm cổ điển và cuộn âm bản"
        fill
        priority
        className="object-cover object-center"
      />

      {/* Directional Editorial Scrim for Crisp Readability */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-ink/92 via-brand-ink/75 to-brand-ink/35"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-ink/90 via-transparent to-brand-ink/30"
      />

      {/* Main Content Container - Aligned to max-w-7xl */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <p className="mb-5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-white/70">
          CINEGEN — Analog Photography Platform
        </p>

        <h1 className="max-w-3xl font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.08]">
          Tôn vinh khoảnh khắc &amp; bản sắc nghệ thuật{" "}
          <span className="text-brand-glow">nhiếp ảnh phim.</span>
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
          Sân chơi dành riêng cho cộng đồng chụp phim 35mm, 120 và Large Format.
          Minh bạch từ khâu kiểm định âm bản đến chấm thi ẩn danh độc lập.
        </p>

        <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Button
            size="lg"
            asChild
            className="h-12 rounded-full bg-brand-solid px-7 text-sm font-semibold text-white shadow-lg shadow-black/25 transition-all hover:bg-brand-hover active:scale-[0.98]"
          >
            <a href="#ongoing-contests">
              <span>Khám phá cuộc thi</span>
              <ArrowRight className="ml-1.5 size-4" />
            </a>
          </Button>

          <Button
            variant="outline"
            size="lg"
            asChild
            className="h-12 rounded-full border-white/25 bg-white/10 px-6 text-sm font-medium text-white backdrop-blur-md transition-all hover:border-white/40 hover:bg-white/20 hover:text-white"
          >
            <Link href="/register">Tạo tài khoản thí sinh</Link>
          </Button>
        </div>
      </div>

      {/* Bottom Editorial Specs Strip - Aligned to max-w-7xl */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 border-t border-white/15 pt-7 sm:grid-cols-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-white/55">
              01 / Định dạng
            </p>
            <p className="mt-1 font-heading text-sm font-semibold text-white">
              35mm, 120 Medium &amp; 4×5
            </p>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-white/55">
              02 / Xác thực
            </p>
            <p className="mt-1 font-heading text-sm font-semibold text-white">
              Đối chiếu âm bản &amp; kiểm định AI
            </p>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-white/55">
              03 / Giám khảo
            </p>
            <p className="mt-1 font-heading text-sm font-semibold text-white">
              Chấm thi ẩn danh kép (Double-Blind)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
