import {
  AlertCircle,
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Cpu,
  FileText,
  Film,
  Scale,
  Share2,
  Sparkles,
  Upload,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/home/footer";
import { Navbar } from "@/components/home/navbar";
import { formatContestDate } from "@/lib/contest-utils";
import { DETAILED_CONTESTS } from "@/lib/mock-contest-details";
import type { Contest } from "@/types/contest";

export function generateStaticParams() {
  return Object.keys(DETAILED_CONTESTS).map((id) => ({ id }));
}

interface ContestDetailPageProps {
  params: Promise<{ id: string }>;
}

function getContestDetail(id: string): Contest | null {
  if (DETAILED_CONTESTS[id]) {
    return DETAILED_CONTESTS[id];
  }

  return {
    ...DETAILED_CONTESTS["contest-1"],
    id,
    name: `Cuộc thi Nhiếp ảnh Phim #${id}`,
  };
}

export default async function ContestDetailPage({
  params,
}: ContestDetailPageProps) {
  const resolvedParams = await params;
  const contest = await getContestDetail(resolvedParams.id);

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
              <span className="font-mono text-zinc-200 bg-zinc-800 px-2 py-0.5 rounded">
                {contest.id}
              </span>
            </div>
          </div>
        </div>

        {/* Hero Banner Header of Contest */}
        <section className="relative overflow-hidden border-b border-zinc-800 bg-gradient-to-b from-[#191d20] to-[#111416] py-12 lg:py-16">
          <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-amber-500/10 blur-[130px] pointer-events-none rounded-full" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-3xl">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2.5 mb-4">
                  {isOngoing ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      Đang nhận bài dự thi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/30">
                      <Clock className="h-3.5 w-3.5" />
                      Sắp mở nhận bài
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/80 px-3 py-1 text-xs font-mono text-amber-300 border border-zinc-700">
                    <Film className="h-3.5 w-3.5 text-amber-400" />
                    {contest.category ?? "35mm & 120 Film"}
                  </span>

                  <span className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800">
                    <Sparkles className="h-3 w-3 text-amber-400" /> AI
                    Grain-Verified
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                  {contest.name}
                </h1>

                {/* Description */}
                <p className="mt-4 text-base sm:text-lg text-zinc-300 leading-relaxed">
                  {contest.description}
                </p>

                {/* Timeline */}
                <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-400" />
                    <span>Thời hạn:</span>
                    <strong className="text-white">
                      {formatContestDate(contest.start_at)} —{" "}
                      {formatContestDate(contest.end_at)}
                    </strong>
                  </div>
                  {contest.prize && (
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-amber-400" />
                      <span>Tổng giải thưởng:</span>
                      <strong className="text-amber-300">
                        {contest.prize}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Box Card */}
              <div className="w-full lg:w-80 shrink-0 rounded-2xl border border-zinc-700/80 bg-[#1e2327] p-6 shadow-2xl">
                <div className="text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1">
                  Trạng thái nộp bài
                </div>
                <div className="text-xl font-bold text-white mb-4">
                  {isOngoing ? "Mở cổng nhận ảnh" : "Đang chuẩn bị"}
                </div>

                <div className="space-y-3 mb-6 text-xs text-zinc-300">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-700/60">
                    <span>Định dạng phim:</span>
                    <span className="font-semibold text-white">
                      {contest.film_requirements?.formats.join(", ") ??
                        "35mm / 120"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-700/60">
                    <span>Số ảnh tối đa:</span>
                    <span className="font-semibold text-white">
                      {contest.film_requirements?.max_photos_per_submission ??
                        5}{" "}
                      ảnh
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-700/60">
                    <span>Kiểm định AI:</span>
                    <span className="font-semibold text-emerald-400">
                      Bắt buộc
                    </span>
                  </div>
                </div>

                <Link
                  href="/login"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-400 py-3.5 text-sm font-bold text-black hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/20 active:scale-95"
                >
                  <Upload className="h-4 w-4" />
                  <span>Nộp bài dự thi ngay</span>
                </Link>

                <p className="mt-3 text-center text-[11px] text-zinc-400">
                  Thí sinh cần đăng nhập tài khoản để gửi tác phẩm
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4 MAIN CONTENT BLOCKS (THEO YÊU CẦU JIRA FPC-38) */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Thể lệ & Tiêu chí & Giám khảo */}
            <div className="lg:col-span-2 space-y-12">
              {/* KHỐI 1: THỂ LỆ THAM GIA */}
              <section className="rounded-2xl border border-zinc-800 bg-[#191d20] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                  <div className="h-10 w-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Thể lệ &amp; Quy định Tham gia
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Vui lòng đọc kỹ các điều kiện bắt buộc trước khi nộp bài
                    </p>
                  </div>
                </div>

                {/* Yêu cầu cuộn phim */}
                <div className="mb-6 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Film className="h-4 w-4" /> Yêu cầu Kỹ thuật Phim
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-300">
                    <div>
                      • <strong>Khổ phim chấp nhận:</strong>{" "}
                      {contest.film_requirements?.formats.join(", ") ??
                        "35mm, 120"}
                    </div>
                    <div>
                      • <strong>Chủng loại phim:</strong>{" "}
                      {contest.film_requirements?.types.join(", ") ??
                        "Màu & Trắng đen"}
                    </div>
                    <div>
                      • <strong>Chỉnh sửa kỹ thuật số:</strong>{" "}
                      {contest.film_requirements?.allow_digital_editing
                        ? "Được phép cơ bản"
                        : "Nghiêm cấm can thiệp số (No AI / No Photoshop ghép)"}
                    </div>
                    <div>
                      • <strong>Scan phim:</strong> File scan độ phân giải cao
                      từ cuộn phim gốc
                    </div>
                  </div>
                </div>

                {/* Danh sách quy định */}
                <div className="space-y-3.5">
                  {(contest.rules ?? []).map((rule, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-[11px] font-bold text-amber-300 mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {rule}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* KHỐI 2: BAN GIÁM KHẢO */}
              <section className="rounded-2xl border border-zinc-800 bg-[#191d20] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                  <div className="h-10 w-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Hội đồng Ban Giám Khảo
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Các nhiếp ảnh gia và chuyên gia quang học uy tín
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(contest.judges ?? []).map((judge) => (
                    <div
                      key={judge.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-11 w-11 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold flex items-center justify-center text-sm">
                            {judge.name
                              .split(" ")
                              .map((n) => n[0])
                              .slice(-2)
                              .join("")}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">
                              {judge.name}
                            </h4>
                            <span className="inline-block text-[11px] font-medium text-amber-400">
                              {judge.role}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {judge.bio}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* KHỐI 4 (BỔ TRỢ): TIÊU CHÍ CHẤM ĐIỂM */}
              <section className="rounded-2xl border border-zinc-800 bg-[#191d20] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                  <div className="h-10 w-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center">
                    <Scale className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Tiêu chí Chấm điểm Minh bạch
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Tỷ trọng đánh giá tác phẩm từ Hội đồng chuyên môn
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {(contest.criteria ?? []).map((crit) => (
                    <div
                      key={crit.id}
                      className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-white">
                          {crit.name}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                          {crit.weight}%
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        {crit.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right 1 Col: KHỐI 3 — CƠ CẤU GIẢI THƯỞNG */}
            <div className="space-y-8">
              <section className="rounded-2xl border border-amber-500/30 bg-[#1e2327] p-6 sm:p-8 sticky top-24 shadow-xl shadow-black/40">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-700/80">
                  <div className="h-10 w-10 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Cơ cấu Giải thưởng
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Vinh danh các tác phẩm nghệ thuật xuất sắc
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {(contest.prizes ?? []).map((prize, idx) => (
                    <div
                      key={prize.id}
                      className={`p-4 rounded-xl border transition-all ${
                        idx === 0
                          ? "bg-amber-400/10 border-amber-400/40"
                          : "bg-zinc-900/70 border-zinc-800"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${
                            idx === 0 ? "text-amber-300" : "text-zinc-400"
                          }`}
                        >
                          {prize.rank}
                        </span>
                        {idx === 0 && (
                          <span className="text-[10px] bg-amber-400 text-black px-1.5 py-0.5 rounded font-extrabold uppercase">
                            Cao nhất
                          </span>
                        )}
                      </div>
                      <div className="text-base font-extrabold text-white mb-1.5">
                        {prize.name}
                      </div>
                      <div className="text-xs font-semibold text-amber-400 mb-2">
                        {prize.reward}
                      </div>
                      {prize.description && (
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          {prize.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-700/80">
                  <Link
                    href="/login"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-xs font-bold text-black hover:bg-amber-300 transition-colors"
                  >
                    <span>Đăng nhập để gửi ảnh dự thi</span>
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
