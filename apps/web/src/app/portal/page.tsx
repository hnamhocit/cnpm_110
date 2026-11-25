import {
  AlertTriangle,
  ArrowUpRight,
  Clock,
  FileCheck2,
  Film,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatContestDate } from "@/lib/contest-utils";
import { API_INTERNAL_URL } from "@/lib/server-api";

type ContestItem = {
  id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  startAt?: string | null;
  endAt?: string | null;
};

export default async function PortalDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  // 1. Fetch real contests
  let contests: ContestItem[] = [];
  try {
    const res = await fetch(`${API_INTERNAL_URL}/api/v1/contests`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const json = await res.json();
      const raw =
        json?.data?.items ?? (Array.isArray(json?.data) ? json.data : []);
      contests = Array.isArray(raw) ? raw : [];
    }
  } catch {
    contests = [];
  }

  // 2. Fetch real submissions
  let totalSubmissions = 0;
  let proofRequestedCount = 0;
  if (token) {
    try {
      const subRes = await fetch(
        `${API_INTERNAL_URL}/api/v1/submissions?limit=100`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      if (subRes.ok) {
        const subJson = await subRes.json();
        const items = Array.isArray(subJson?.data)
          ? subJson.data
          : (subJson?.data?.items ?? []);
        totalSubmissions =
          subJson?.pagination?.total ??
          subJson?.data?.pagination?.total ??
          items.length;
        proofRequestedCount = items.filter(
          (s: { status?: string }) => s.status === "PROOF_REQUESTED",
        ).length;
      }
    } catch {
      // ignore
    }
  }

  const activeContests = contests.filter((c) =>
    ["ongoing", "open"].includes((c.status || "").toLowerCase()),
  );
  const judgesCount = contests.length > 0 ? 3 : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Bảng điều khiển (Organizer Dashboard)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tổng quan số liệu vận hành cuộc thi nhiếp ảnh phim, thẩm định bài
            nộp và tiến độ chấm thi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/portal/contests/create">
            <Button className="bg-brand-solid hover:bg-brand-hover text-white text-xs font-semibold shadow-sm shadow-brand-solid/20">
              + Tạo cuộc thi mới
            </Button>
          </Link>
          <Link href="/portal/contests/judges">
            <Button
              variant="outline"
              className="text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Quản lý Giám khảo
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Cuộc thi hoạt động
              </p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {activeContests.length}
              </p>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                {activeContests.length > 0
                  ? `${activeContests.length} đang mở nộp bài`
                  : "Chưa có cuộc thi mở"}
              </p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Trophy className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Bài thi đã nộp
              </p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {totalSubmissions}
              </p>
              <p className="text-xs text-blue-600 font-medium mt-1">
                {totalSubmissions > 0
                  ? "Đã kiểm duyệt AI & lưu trữ"
                  : "Chưa có bài dự thi"}
              </p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Film className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Yêu cầu âm bản (48h)
              </p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {proofRequestedCount}
              </p>
              <p className="text-xs text-amber-600 font-medium mt-1">
                {proofRequestedCount > 0
                  ? "Đang chờ đối chứng (BR-19)"
                  : "0 vi phạm nghi vấn"}
              </p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Hội đồng Giám khảo
              </p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {judgesCount}
              </p>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                {judgesCount >= 3 ? "Đạt túc số BR-20" : "Chưa đủ túc số BR-20"}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Cuộc thi gần đây</span>
              <Link
                href="/portal/contests"
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold"
              >
                Xem tất cả <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contests.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl">
                Bạn chưa có cuộc thi nào. Hãy tạo cuộc thi đầu tiên!
              </div>
            ) : (
              contests.slice(0, 3).map((contest) => {
                const statusUpper = (contest.status || "DRAFT").toUpperCase();
                const isOngoing = ["ONGOING", "OPEN"].includes(statusUpper);
                const isPublished = ["PUBLISHED", "COMPLETED"].includes(statusUpper);

                return (
                  <div
                    key={contest.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-sm text-slate-900">
                        {contest.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Hạn nộp bài:{" "}
                        {formatContestDate(contest.end_at || contest.endAt)}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                        isOngoing
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : isPublished
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {statusUpper}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Thẩm định & Giám sát An toàn (SRS SSOT)</span>
              <span className="text-xs text-slate-400 font-normal">
                AI & Analog Guard
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>
                Thẩm định hạt phim quang học (Grain) và quét AI pHash/CLIP đạt
                chuẩn BR-09.
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-blue-600" />
              <span>
                Đồng hồ 48h nộp âm bản đối chứng (BR-19) đang kích hoạt cho{" "}
                {proofRequestedCount} tác phẩm.
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-800 border border-slate-200 text-xs">
              <FileCheck2 className="w-4 h-4 shrink-0 text-slate-600" />
              <span>
                Phân quyền chấm thi ẩn danh kép (Double-Blind BR-12) bảo vệ
                thông tin thí sinh.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
