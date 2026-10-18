import { ArrowRight, Award, Film, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#111416] via-[#191d20] to-[#111416] py-20 lg:py-28">
      {/* Background Glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-semibold text-amber-300 backdrop-blur-sm mb-8 animate-fade-in">
          <Film className="h-3.5 w-3.5 text-amber-400" />
          <span>Nền tảng Cuộc thi Nhiếp ảnh Phim 2026</span>
          <span className="text-zinc-500">•</span>
          <span className="flex items-center gap-1 text-zinc-300">
            <Sparkles className="h-3 w-3 text-amber-400" /> AI Verified
          </span>
        </div>

        {/* Heading */}
        <h1 className="mx-auto max-w-4xl text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
          Tôn vinh Khoảnh khắc &amp; Bản sắc Nghệ thuật{" "}
          <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
            Nhiếp ảnh Phim
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-zinc-400 leading-relaxed">
          Nền tảng thi đua nhiếp ảnh phim kết hợp trí tuệ nhân tạo. Quản lý minh
          bạch, tự động phát hiện ảnh giả lập AI hoặc trùng lặp, đảm bảo sân
          chơi thuần khiết dành riêng cho các tín đồ Film Photography.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#ongoing-contests"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 text-sm font-semibold text-black hover:bg-amber-300 transition-all shadow-lg shadow-amber-400/20 active:scale-95"
          >
            <span>Khám phá các cuộc thi đang mở</span>
            <ArrowRight className="h-4 w-4" />
          </a>
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-6 py-3.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all backdrop-blur-sm"
          >
            Tạo tài khoản thí sinh
          </Link>
        </div>

        {/* Highlights / Trust Badges */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-10 border-t border-white/5">
          <div className="flex items-center justify-center sm:justify-start gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/60">
            <div className="p-2 rounded-md bg-amber-400/10 text-amber-400">
              <Film className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-white">
                35mm &amp; 120 Film
              </div>
              <div className="text-xs text-zinc-500">
                Đa dạng thể loại &amp; format
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/60">
            <div className="p-2 rounded-md bg-amber-400/10 text-amber-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-white">
                AI Kiểm định thông minh
              </div>
              <div className="text-xs text-zinc-500">
                Phát hiện ảnh trùng &amp; AI-gen
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/60">
            <div className="p-2 rounded-md bg-amber-400/10 text-amber-400">
              <Award className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-white">
                Giám khảo Chuyên nghiệp
              </div>
              <div className="text-xs text-zinc-500">
                Hệ thống chấm điểm chuẩn mực
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
