import Link from "next/link";
import {
  CheckCircle2,
  HelpCircle,
  Info,
  ShieldCheck,
  Upload,
  UserCheck,
  FileCheck2,
  Sparkles,
} from "lucide-react";
import type { Contest } from "@/types/contest";

interface RegistrationGuideSectionProps {
  contest: Contest;
}

export function RegistrationGuideSection({
  contest,
}: RegistrationGuideSectionProps) {
  const regInfo = contest.registration_info;

  if (!regInfo) return null;

  return (
    <section className="mt-12 rounded-3xl border border-zinc-800 bg-[#161a1d] p-6 sm:p-8 lg:p-10 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Dành cho thí sinh
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Thông tin Đăng ký & Quy trình Dự thi
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Hướng dẫn đầy đủ từ chuẩn bị file ảnh, điều kiện hợp lệ đến các bước nộp bài
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700/60 text-right">
            <div className="text-[10px] uppercase font-mono text-zinc-400">Lệ phí nộp bài</div>
            <div className="text-sm font-bold text-emerald-400">{regInfo.fee}</div>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-black hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/20"
          >
            <Upload className="h-4 w-4" />
            <span>Nộp bài ngay</span>
          </Link>
        </div>
      </div>

      {/* Grid: 4 Steps Workflow */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <FileCheck2 className="h-5 w-5 text-amber-400" />
          Quy trình 4 bước tham gia
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {regInfo.steps.map((step) => (
            <div
              key={`step-${step.step}`}
              className="relative rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 flex flex-col justify-between hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300 font-extrabold text-sm border border-amber-400/30">
                  {step.step}
                </span>
                <span className="text-[10px] uppercase font-mono text-zinc-500">
                  Bước {step.step}
                </span>
              </div>

              <div className="flex-1">
                <h4 className="text-base font-bold text-white mb-2">
                  {step.title}
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {step.tip && (
                <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[11px] text-amber-300/90 flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400" />
                  <span>{step.tip}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Eligibility & Technical Specs Section */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Đối tượng & Điều kiện */}
        <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-6">
          <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-amber-400" />
            Điều kiện & Đối tượng tham dự
          </h4>
          <ul className="space-y-3">
            {regInfo.eligibility.map((item, idx) => (
              <li
                key={`eligibility-${idx}`}
                className="flex items-start gap-3 text-xs sm:text-sm text-zinc-300 leading-relaxed"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tiêu chuẩn kỹ thuật file nộp */}
        <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-6">
          <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-400" />
            Quy chuẩn kỹ thuật file ảnh
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500 block mb-1">Định dạng file:</span>
              <strong className="text-white">
                {regInfo.technical_specs.file_formats.join(", ")}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500 block mb-1">Dung lượng tối đa:</span>
              <strong className="text-white">
                {regInfo.technical_specs.max_file_size}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 col-span-2">
              <span className="text-zinc-500 block mb-1">Độ phân giải yêu cầu:</span>
              <strong className="text-zinc-200">
                {regInfo.technical_specs.min_resolution}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 col-span-2">
              <span className="text-zinc-500 block mb-1">Không gian màu (Color Profile):</span>
              <strong className="text-zinc-200">
                {regInfo.technical_specs.color_space}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="mt-10 pt-8 border-t border-zinc-800">
        <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-amber-400" />
          Câu hỏi thường gặp dành cho người đăng ký
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {regInfo.faqs.map((faq, idx) => (
            <div
              key={`faq-${idx}`}
              className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <h5 className="text-sm font-bold text-white mb-2 flex items-start gap-2">
                <span className="text-amber-400 font-mono text-xs">Q:</span>
                <span>{faq.question}</span>
              </h5>
              <p className="text-xs text-zinc-300 leading-relaxed pl-5 border-l-2 border-zinc-700/60 ml-1">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA Box */}
      <div className="mt-10 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border border-amber-400/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-base font-bold text-white">
            Sẵn sàng chia sẻ góc nhìn của bạn?
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            Cổng nhận bài dự thi đang mở. Hãy đăng nhập để hoàn tất nộp ảnh dự thi.
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
          <Link
            href="/register"
            className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl border border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Đăng ký tài khoản mới
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto text-center px-5 py-2.5 rounded-xl bg-amber-400 text-xs font-bold text-black hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/20"
          >
            Đăng nhập & Nộp bài
          </Link>
        </div>
      </div>
    </section>
  );
}

