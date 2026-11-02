import {
  ArrowLeft,
  Award,
  Calendar,
  Clock,
  FileText,
  Film,
  Upload,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RegistrationGuideSection } from "@/components/contest/registration-guide-section";
import { Footer } from "@/components/home/footer";
import { Navbar } from "@/components/home/navbar";
import { formatContestDate } from "@/lib/contest-utils";
import type { Contest } from "@/types/contest";

interface ContestDetailPageProps {
  params: Promise<{ id: string }>;
}

async function fetchContestDetail(id: string): Promise<Contest | null> {
  const apiUrl =
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8080";
  try {
    const res = await fetch(`${apiUrl}/api/v1/contests/${id}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const json = await res.json();
    return (json?.data ?? json) as Contest;
  } catch {
    return null;
  }
}

export default async function ContestDetailPage({
  params,
}: ContestDetailPageProps) {
  const resolvedParams = await params;
  const contest = await fetchContestDetail(resolvedParams.id);

  if (!contest) {
    notFound();
  }

  const isOngoing = contest.status === "ongoing";

  return (
    <div className="min-h-screen flex flex-col bg-[#111416] text-white selection:bg-amber-400 selection:text-black font-sans">
      <Navbar />

      <main className="flex-1 pb-24">
        {/* Breadcrumb & Navigation */}
        <div className="border-b border-zinc-800 bg-[#161a1d]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs text-zinc-400">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 hover:text-amber-400 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Quay lại Trang chủ</span>
            </Link>
            <div className="flex items-center gap-2">
              <span>Mã cuộc thi:</span>
              <code className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300 font-mono">
                {contest.id}
              </code>
            </div>
          </div>
        </div>

        {/* Hero Section of Contest */}
        <section className="relative overflow-hidden border-b border-zinc-800/80 bg-gradient-to-b from-[#181c1f] to-[#111416] py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8 lg:items-center justify-between">
              <div className="space-y-4 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      isOngoing
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                    {isOngoing ? "Đang diễn ra" : "Đã công bố"}
                  </span>
                  {contest.category && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                      <Film className="h-3 w-3 text-amber-400" />
                      {contest.category}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                  {contest.name}
                </h1>

                {contest.description && (
                  <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl">
                    {contest.description}
                  </p>
                )}

                {/* Timeline metadata badges */}
                <div className="pt-2 flex flex-wrap gap-4 text-xs sm:text-sm text-zinc-400">
                  <div className="flex items-center gap-2 bg-zinc-900/80 px-3.5 py-2 rounded-xl border border-zinc-800">
                    <Calendar className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>
                      Thời hạn: {formatContestDate(contest.start_at)} —{" "}
                      {formatContestDate(contest.end_at)}
                    </span>
                  </div>
                  {contest.prize && (
                    <div className="flex items-center gap-2 bg-zinc-900/80 px-3.5 py-2 rounded-xl border border-zinc-800">
                      <Award className="h-4 w-4 text-amber-400 shrink-0" />
                      <span className="font-semibold text-white">
                        Giải thưởng: {contest.prize}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Box */}
              <div className="lg:w-80 shrink-0 bg-[#191d20] border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                    <span>Trạng thái nhận bài</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" />{" "}
                      {isOngoing ? "Đang mở cổng" : "Chưa mở nộp"}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {contest.registration_info?.fee || "Miễn phí tham gia"}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Tối đa 5 tác phẩm ảnh scan gốc / thí sinh
                  </p>
                </div>

                <div className="space-y-2.5">
                  <a
                    href="#registration-guide"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm shadow-lg shadow-amber-400/10 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Xem hướng dẫn nộp bài</span>
                  </a>
                  <Link
                    href="/login"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Đăng nhập nộp tác phẩm</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Details Grid */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 space-y-16">
          {/* Section 1: Thể lệ & Yêu cầu Kỹ thuật Phim (Film Requirements) */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Rules card */}
            <div className="rounded-3xl bg-[#161a1d] border border-zinc-800/80 p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                <div className="p-2.5 bg-amber-400/10 text-amber-400 rounded-xl">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Thể lệ Cuộc thi
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Quy chuẩn tham dự bắt buộc
                  </p>
                </div>
              </div>
              <ul className="space-y-3.5 text-sm text-zinc-300">
                {contest.rules && contest.rules.length > 0 ? (
                  contest.rules.map((rule) => (
                    <li key={rule} className="flex items-start gap-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                      <span>{rule}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-start gap-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                      <span>
                        Tác phẩm phải được chụp hoàn toàn bằng máy ảnh cơ analog
                        và film quang học truyền thống.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                      <span>
                        Nghiêm cấm mọi hình thức can thiệp bằng trí tuệ nhân tạo
                        (AI) hoặc chỉnh sửa làm thay đổi cấu trúc quang học hạt
                        film.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                      <span>
                        Thí sinh có trách nhiệm lưu trữ dải phim âm bản gốc để
                        đối chứng khi Ban Giám khảo yêu cầu.
                      </span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Film Technical Specs card */}
            <div className="rounded-3xl bg-[#161a1d] border border-zinc-800/80 p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                <div className="p-2.5 bg-amber-400/10 text-amber-400 rounded-xl">
                  <Film className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Yêu cầu Kỹ thuật Phim
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Khổ phim và quy cách tráng quét
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">
                    Khổ phim chấp nhận
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(
                      contest.film_requirements?.formats || [
                        "35mm (135 format)",
                        "120 Medium Format",
                      ]
                    ).map((fmt) => (
                      <span
                        key={fmt}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-zinc-800 text-amber-300 border border-zinc-700"
                      >
                        {fmt}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">
                    Loại phim
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(
                      contest.film_requirements?.types || [
                        "Color Negative (C-41)",
                        "Black & White (B&W)",
                        "Slide (E-6)",
                      ]
                    ).map((t) => (
                      <span
                        key={t}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-zinc-900 text-zinc-300 border border-zinc-800"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Registration Guide Section */}
          <div id="registration-guide">
            <RegistrationGuideSection contest={contest} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
