import { ArrowRight, Award, Film, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-brand-canvas via-white to-brand-canvas py-20 lg:py-28">
      {/* Background Soft Glow effects - matches auth layout */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[180px] -left-[140px] size-[520px] rounded-full bg-brand-glow/40 blur-[100px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[120px] -bottom-[160px] size-[480px] rounded-full bg-brand-glow/35 blur-[100px]"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-glow bg-brand-soft px-4 py-1.5 text-xs font-semibold text-brand-hover shadow-sm mb-8 animate-fade-in">
          <Film className="h-3.5 w-3.5 text-brand-solid" />
          <span>Nền tảng Cuộc thi Nhiếp ảnh Phim 2026</span>
          <span className="text-brand-glow">•</span>
          <span className="flex items-center gap-1 text-brand-solid">
            <Sparkles className="h-3 w-3 text-brand-solid" /> AI Verified
          </span>
        </div>

        {/* Heading */}
        <h1 className="mx-auto max-w-4xl text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
          Tôn vinh Khoảnh khắc &amp; Bản sắc Nghệ thuật{" "}
          <span className="bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-cyan bg-clip-text text-transparent">
            Nhiếp ảnh Phim
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed">
          Nền tảng thi đua nhiếp ảnh phim kết hợp trí tuệ nhân tạo. Quản lý minh
          bạch, tự động phát hiện ảnh giả lập AI hoặc trùng lặp, đảm bảo sân
          chơi thuần khiết dành riêng cho các tín đồ Film Photography.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#ongoing-contests"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-solid px-6 py-3.5 text-sm font-semibold text-white hover:bg-brand-hover transition-all shadow-md shadow-brand-solid/30 active:scale-95"
          >
            <span>Khám phá các cuộc thi đang mở</span>
            <ArrowRight className="h-4 w-4" />
          </a>
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
          >
            Tạo tài khoản thí sinh
          </Link>
        </div>

        {/* Highlights / Trust Badges */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-10 border-t border-slate-200">
          <div className="flex items-center justify-center sm:justify-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="p-2.5 rounded-xl bg-brand-soft text-brand-solid">
              <Film className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-slate-900">
                35mm &amp; 120 Film
              </div>
              <div className="text-xs text-slate-500">
                Đa dạng thể loại &amp; format
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="p-2.5 rounded-xl bg-brand-soft text-brand-solid">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-slate-900">
                AI Kiểm định thông minh
              </div>
              <div className="text-xs text-slate-500">
                Phát hiện ảnh trùng &amp; AI-gen
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="p-2.5 rounded-xl bg-brand-soft text-brand-solid">
              <Award className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-slate-900">
                Giám khảo Chuyên nghiệp
              </div>
              <div className="text-xs text-slate-500">
                Hệ thống chấm điểm chuẩn mực
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
