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
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PortalDashboardPage() {
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
            <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-600/20">
              + Tạo cuộc thi mới
            </Button>
          </Link>
          <Link href="/portal/contests/judges">
            <Button variant="outline" className="text-xs border-slate-300 text-slate-700 hover:bg-slate-50">
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
              <p className="text-2xl font-black text-slate-900 mt-1">4</p>
              <p className="text-xs text-emerald-600 font-medium mt-1">2 đang mở nộp bài</p>
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
              <p className="text-2xl font-black text-slate-900 mt-1">218</p>
              <p className="text-xs text-blue-600 font-medium mt-1">
                Đã kiểm duyệt AI 100%
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
              <p className="text-2xl font-black text-slate-900 mt-1">12</p>
              <p className="text-xs text-amber-600 font-medium mt-1">
                Đang chờ thí sinh upload
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
              <p className="text-2xl font-black text-slate-900 mt-1">16</p>
              <p className="text-xs text-emerald-600 font-medium mt-1">Đạt túc số BR-20</p>
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
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-slate-900">
                  Cuộc thi Ảnh Phim Toàn Quốc 2026
                </p>
                <p className="text-xs text-slate-500">
                  Hạn nộp bài: 30/11/2026 • 120 thí sinh
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ACTIVE
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-slate-900">
                  Triển lãm Nghệ thuật Đen Trắng 2026
                </p>
                <p className="text-xs text-slate-500">
                  Bắt đầu chấm: 15/12/2026 • 68 thí sinh
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                JUDGING
              </span>
            </div>
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
                Đồng hồ 48h nộp âm bản đối chứng (BR-19) đang kích hoạt cho 12
                tác phẩm.
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
