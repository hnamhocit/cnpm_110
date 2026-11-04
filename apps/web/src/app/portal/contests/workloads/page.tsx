"use client";

import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock,
  Layers,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type JudgeWorkload = {
  judgeId: string;
  fullName: string;
  email: string;
  role: string;
  assignedCategories: string[];
  totalAllocated: number; // Tổng số bài được phân bổ
  completedEvaluations: number; // Đã chấm xong
  pendingEvaluations: number; // Còn đang chấm
  flaggedVariances: number; // Số bài bị cảnh báo lệch điểm > 30% (BR-14)
  progressPercent: number; // % Tiến độ
};

const INITIAL_WORKLOADS: JudgeWorkload[] = [
  {
    judgeId: "judge-1",
    fullName: "Nguyễn Văn Nghệ",
    email: "nghe.nguyen@analoglab.vn",
    role: "Trưởng ban giám khảo",
    assignedCategories: ["Ảnh Đen Trắng", "Ảnh Đường Phố"],
    totalAllocated: 45,
    completedEvaluations: 38,
    pendingEvaluations: 7,
    flaggedVariances: 2,
    progressPercent: 84.4,
  },
  {
    judgeId: "judge-2",
    fullName: "Trần Minh Quân",
    email: "quan.tran@vietnamfilm.org",
    role: "Giám khảo chuyên môn",
    assignedCategories: ["Ảnh Phong Cảnh & Thiên Nhiên", "Chân Dung Phim Màu"],
    totalAllocated: 52,
    completedEvaluations: 52,
    pendingEvaluations: 0,
    flaggedVariances: 1,
    progressPercent: 100.0,
  },
  {
    judgeId: "judge-3",
    fullName: "Hoàng Thảo My",
    email: "thaomy.photo@studio.com",
    role: "Giám khảo khách mời",
    assignedCategories: ["Chân Dung Phim Màu", "Ảnh Đường Phố"],
    totalAllocated: 38,
    completedEvaluations: 19,
    pendingEvaluations: 19,
    flaggedVariances: 3,
    progressPercent: 50.0,
  },
  {
    judgeId: "judge-4",
    fullName: "Đặng Quang Huy",
    email: "huy.dang@visualarts.edu.vn",
    role: "Giám khảo chuyên môn",
    assignedCategories: ["Ảnh Đen Trắng", "Ảnh Phong Cảnh & Thiên Nhiên"],
    totalAllocated: 48,
    completedEvaluations: 34,
    pendingEvaluations: 14,
    flaggedVariances: 0,
    progressPercent: 70.8,
  },
];

export default function JudgeWorkloadTrackerPage() {
  const [workloads, _setWorkloads] =
    useState<JudgeWorkload[]>(INITIAL_WORKLOADS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContest, setSelectedContest] = useState("fpc-2026-national");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const searchInputId = useId();
  const contestSelectId = useId();
  const categorySelectId = useId();

  // Thống kê toàn diện
  const totalSubmissionsAllocated = workloads.reduce(
    (sum, item) => sum + item.totalAllocated,
    0,
  );
  const totalCompleted = workloads.reduce(
    (sum, item) => sum + item.completedEvaluations,
    0,
  );
  const totalPending = workloads.reduce(
    (sum, item) => sum + item.pendingEvaluations,
    0,
  );
  const totalVariances = workloads.reduce(
    (sum, item) => sum + item.flaggedVariances,
    0,
  );
  const overallProgress =
    totalSubmissionsAllocated > 0
      ? Math.round((totalCompleted / totalSubmissionsAllocated) * 100)
      : 0;

  // Lọc danh sách giám khảo
  const filteredWorkloads = workloads.filter((item) => {
    const matchesSearch =
      item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "ALL"
        ? true
        : item.assignedCategories.includes(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Quay lại */}
      <div className="flex items-center justify-between">
        <Link
          href="/portal/contests"
          className="inline-flex items-center text-sm text-gray-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách cuộc thi
        </Link>
        <span className="text-xs bg-purple-100 text-purple-800 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
          <BarChart3 className="w-3.5 h-3.5" /> Giám sát Tiến độ Chấm thi
          (SCR-ORG-08)
        </span>
      </div>

      {/* Header tiêu đề */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Bảng Theo dõi Phân bổ Bài thi cho Giám khảo
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Giám sát số lượng tác phẩm ảnh phim được giao, tiến độ chấm điểm và
            các cảnh báo lệch điểm cần hội đồng điều phối.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            id={contestSelectId}
            value={selectedContest}
            onChange={(e) => setSelectedContest(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="fpc-2026-national">
              Cuộc thi Ảnh Phim Toàn Quốc 2026
            </option>
            <option value="fpc-2026-monochrome">
              Triển lãm Nghệ thuật Đen Trắng 2026
            </option>
          </select>
        </div>
      </div>

      {/* 4 Thẻ chỉ số chính */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-gray-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">
                Tổng bài phân bổ
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalSubmissionsAllocated}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Đã chấm xong</p>
              <p className="text-2xl font-bold text-emerald-700">
                {totalCompleted}{" "}
                <span className="text-xs text-gray-400">
                  ({overallProgress}%)
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Đang chờ chấm</p>
              <p className="text-2xl font-bold text-amber-700">
                {totalPending}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">
                Lệch điểm &gt; 30%
              </p>
              <p className="text-2xl font-bold text-rose-700">
                {totalVariances}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tìm kiếm & Lọc */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id={searchInputId}
              type="text"
              placeholder="Tìm giám khảo theo tên, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Label
              htmlFor={categorySelectId}
              className="text-xs text-gray-500 whitespace-nowrap"
            >
              Hạng mục:
            </Label>
            <select
              id={categorySelectId}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="ALL">Tất cả hạng mục</option>
              <option value="Ảnh Đen Trắng">Ảnh Đen Trắng</option>
              <option value="Ảnh Đường Phố">Ảnh Đường Phố</option>
              <option value="Ảnh Phong Cảnh & Thiên Nhiên">
                Ảnh Phong Cảnh & Thiên Nhiên
              </option>
              <option value="Chân Dung Phim Màu">Chân Dung Phim Màu</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Bảng Chi tiết Phân bổ Giám khảo */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg">
            Chi tiết Tiến độ Từng Giám khảo
          </CardTitle>
          <CardDescription className="text-xs">
            Theo dõi tải công việc và phát hiện các trường hợp chậm tiến độ chấm
            thi
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 border-b text-xs text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Giám khảo</th>
                  <th className="py-3.5 px-4">Hạng mục phụ trách</th>
                  <th className="py-3.5 px-4 text-center">Được giao</th>
                  <th className="py-3.5 px-4 text-center">Đã chấm</th>
                  <th className="py-3.5 px-4 text-center">Còn lại</th>
                  <th className="py-3.5 px-4 text-center">Lệch điểm (BR-14)</th>
                  <th className="py-3.5 px-4">Tiến độ hoàn thành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredWorkloads.map((judge) => (
                  <tr
                    key={judge.judgeId}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    {/* Giám khảo */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs uppercase">
                          {judge.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .slice(-2)
                            .join("")}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {judge.fullName}
                          </p>
                          <p className="text-xs text-gray-400">{judge.role}</p>
                        </div>
                      </div>
                    </td>

                    {/* Hạng mục */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {judge.assignedCategories.map((cat) => (
                          <span
                            key={cat}
                            className="inline-block text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Số lượng */}
                    <td className="py-4 px-4 text-center font-bold text-gray-900">
                      {judge.totalAllocated}
                    </td>

                    <td className="py-4 px-4 text-center font-semibold text-emerald-600">
                      {judge.completedEvaluations}
                    </td>

                    <td className="py-4 px-4 text-center font-semibold text-amber-600">
                      {judge.pendingEvaluations}
                    </td>

                    <td className="py-4 px-4 text-center">
                      {judge.flaggedVariances > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                          <AlertCircle className="w-3 h-3" />
                          {judge.flaggedVariances} bài
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">
                          0
                        </span>
                      )}
                    </td>

                    {/* Thanh tiến độ */}
                    <td className="py-4 px-4 min-w-[160px]">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-700">
                            {judge.progressPercent}%
                          </span>
                          {judge.progressPercent === 100 && (
                            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Xong
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              judge.progressPercent === 100
                                ? "bg-emerald-500"
                                : judge.progressPercent >= 70
                                  ? "bg-blue-500"
                                  : "bg-amber-500"
                            }`}
                            style={{ width: `${judge.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
