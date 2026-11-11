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

export const instant = false;

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
    <div className="min-h-screen flex flex-col bg-[#f4f7ff] text-slate-900 selection:bg-blue-600 selection:text-white font-sans">
      <Navbar />

      <main className="flex-1 pb-24">
        {/* Breadcrumb & Navigation */}
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs text-slate-500">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Quay lại Trang chủ</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Cuộc thi</span>
              <span className="text-slate-400">/</span>
              <span className="font-semibold text-slate-800 line-clamp-1 max-w-[200px] sm:max-w-xs">
                {contest.name}
              </span>
            </div>
          </div>
        </div>

        {/* Hero Banner Section */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-white py-12 lg:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-[160px] -left-[140px] size-[460px] rounded-full bg-blue-100/60 blur-[100px]"
          />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Column: Title & Info */}
              <div className="lg:col-span-2 space-y-5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      isOngoing
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {isOngoing ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Đang mở nhận bài thi
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3" />
                        Sắp diễn ra
                      </>
                    )}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    <Film className="h-3 w-3 text-blue-600" />
                    {contest.category ?? "Film 35mm / 120"}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  {contest.name}
                </h1>

                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
                  {contest.description ||
                    "Cuộc thi ảnh phim thường niên tôn vinh các tác phẩm chụp phim nguyên bản, gìn giữ nét đẹp quang học cổ điển và nghệ thuật nhiếp ảnh truyền thống."}
                </p>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Thời gian nộp bài</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatContestDate(contest.start_at)} —{" "}
                      {formatContestDate(contest.end_at)}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <Award className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Cơ cấu giải thưởng</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      Huy chương &amp; Triển lãm
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: CTA card */}
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8 space-y-6 shadow-sm">
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    Tham gia Cuộc thi
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Đọc kỹ hướng dẫn thể lệ bên dưới trước khi đăng nhập và nộp tác phẩm dự thi của bạn.
                  </p>
                </div>

                <div className="space-y-3">
                  <a
                    href="#registration-guide"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/30 transition-all"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Xem hướng dẫn nộp bài</span>
                  </a>
                  <Link
                    href="/login"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors shadow-sm"
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
          {/* Section 1: Thể lệ & Yêu cầu Kỹ thuật Phim */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Rules card */}
            <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Thể lệ Cuộc thi
                  </h2>
                  <p className="text-xs text-slate-500">
                    Quy chuẩn tham dự bắt buộc
                  </p>
                </div>
              </div>
              <ul className="space-y-3.5 text-sm text-slate-600">
                {contest.rules && contest.rules.length > 0 ? (
                  contest.rules.map((rule) => (
                    <li key={rule} className="flex items-start gap-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                      <span>{rule}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-start gap-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                      <span>
                        Tác phẩm phải được chụp hoàn toàn bằng máy ảnh cơ analog và film quang học truyền thống.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                      <span>
                        Nghiêm cấm mọi hình thức can thiệp bằng trí tuệ nhân tạo (AI) hoặc chỉnh sửa làm thay đổi cấu trúc quang học hạt film.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                      <span>
                        Thí sinh có trách nhiệm lưu trữ dải phim âm bản gốc để đối chứng khi Ban Giám khảo yêu cầu.
                      </span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Film Technical Specs card */}
            <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Film className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Yêu cầu Kỹ thuật Phim
                  </h2>
                  <p className="text-xs text-slate-500">
                    Khổ phim và quy cách tráng quét
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
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
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                      >
                        {fmt}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
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
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
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
