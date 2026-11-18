import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  Film,
  Layers,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatContestDate } from "@/lib/contest-utils";
import { API_INTERNAL_URL } from "@/lib/server-api";

type ContestDetailPageProps = {
  params: Promise<{ id: string }>;
};

type ContestData = {
  id: string;
  name: string;
  description: string | null;
  start_at: string | null;
  end_at: string | null;
  startAt?: string | null;
  endAt?: string | null;
  status: string;
  created_at: string;
};

async function getContest(id: string): Promise<ContestData | null> {
  try {
    const res = await fetch(`${API_INTERNAL_URL}/api/v1/contests/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json) as ContestData;
  } catch {
    return null;
  }
}

const STATUS_STYLES: Record<string, string> = {
  published: "bg-green-100 text-green-700 border-green-200",
  ongoing: "bg-green-100 text-green-700 border-green-200",
  draft: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-gray-100 text-gray-700 border-gray-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

export default async function PortalContestOverviewPage({
  params,
}: ContestDetailPageProps) {
  const { id } = await params;
  const contest = await getContest(id);

  if (!contest) {
    notFound();
  }

  const status = (contest.status ?? "").toLowerCase() || "draft";
  const statusBadgeClass =
    STATUS_STYLES[status] ?? "bg-blue-100 text-blue-700 border-blue-200";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <Link
            href="/portal/contests"
            className="inline-flex items-center text-xs text-gray-500 hover:text-black mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Quay lại danh sách cuộc thi
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              {contest.name}
            </h1>
            <span
              className={`px-2.5 py-0.5 text-xs rounded-full font-semibold border ${statusBadgeClass}`}
            >
              {status.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Mã UUID: {contest.id}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/contests/${contest.id}`} target="_blank">
            <Button variant="outline" size="sm" className="text-xs">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Xem trang công khai
            </Button>
          </Link>
          <Link href={`/portal/contests/${contest.id}/submissions`}>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
              <Film className="w-3.5 h-3.5 mr-1.5" /> Quản lý bài dự thi
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href={`/portal/contests/${contest.id}/submissions`}>
          <Card className="hover:border-blue-300 hover:shadow-sm transition cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Bài dự thi</p>
                <p className="text-xs text-gray-500">Thẩm định AI & Duyệt bài</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/portal/contests/criteria?contestId=${contest.id}`}>
          <Card className="hover:border-amber-300 hover:shadow-sm transition cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Tiêu chí chấm điểm</p>
                <p className="text-xs text-gray-500">Cấu hình 100% trọng số BR-15</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/contests/judges">
          <Card className="hover:border-emerald-300 hover:shadow-sm transition cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Ban giám khảo</p>
                <p className="text-xs text-gray-500">Mời & quản lý túc số BR-20</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/contests/assignments">
          <Card className="hover:border-purple-300 hover:shadow-sm transition cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Phân công chấm</p>
                <p className="text-xs text-gray-500">Chống xung đột lợi ích BR-21</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Description & Rules */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông tin & Thể lệ cuộc thi</CardTitle>
              <CardDescription>Chi tiết chủ đề và quy định cho thí sinh</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {contest.description || "Chưa có mô tả chi tiết cho cuộc thi này."}
            </CardContent>
          </Card>
        </div>

        {/* Right: Timeline & Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" /> Tiến độ cuộc thi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="border-l-2 border-blue-500 pl-3 py-1">
                <p className="font-semibold text-gray-900">Bắt đầu nhận bài</p>
                <p className="text-gray-500 mt-0.5">
                  {formatContestDate(contest.startAt ?? contest.start_at)}
                </p>
              </div>

              <div className="border-l-2 border-emerald-500 pl-3 py-1">
                <p className="font-semibold text-gray-900">Kết thúc & Công bố</p>
                <p className="text-gray-500 mt-0.5">
                  {formatContestDate(contest.endAt ?? contest.end_at)}
                </p>
              </div>

              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between text-gray-500">
                  <span>Ngày khởi tạo:</span>
                  <span className="font-medium text-gray-700">
                    {formatContestDate(contest.created_at)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
