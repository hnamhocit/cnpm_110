"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Layers,
  Plus,
  Save,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { http } from "@/lib/http";

export type JudgeMember = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isParticipatingAsContestant?: boolean;
};

export type CategoryAssignment = {
  categoryId: string;
  categoryName: string;
  roundName: string;
  assignedJudgeIds: string[];
};

// TODO(Backend): Chờ API GET /api/v1/contests/:id/judges để fetch danh sách giám khảo.
// TODO(Backend): Chờ API GET /api/v1/contests/:id/judges/assignments để fetch phân công.
// TODO(Backend): Chờ API POST /api/v1/contests/:id/judges/assignments để lưu phân công.
// Mock data tạm thời cho UI testing. Cần xóa khi backend sẵn sàng.
const INITIAL_AVAILABLE_JUDGES: JudgeMember[] = [
  {
    id: "judge-1",
    fullName: "Nguyễn Văn Nghệ",
    email: "nghe.nguyen@analoglab.vn",
    role: "Trưởng ban giám khảo",
  },
  {
    id: "judge-2",
    fullName: "Trần Minh Quân",
    email: "quan.tran@vietnamfilm.org",
    role: "Giám khảo chuyên môn",
  },
  {
    id: "judge-3",
    fullName: "Hoàng Thảo My",
    email: "thaomy.photo@studio.com",
    role: "Giám khảo khách mời",
  },
  {
    id: "judge-4",
    fullName: "Đặng Quang Huy",
    email: "huy.dang@visualarts.edu.vn",
    role: "Giám khảo chuyên môn",
  },
  {
    id: "judge-5",
    fullName: "Lê Khắc Toàn",
    email: "toan.le@filmcommunity.vn",
    role: "Giám khảo chuyên môn",
    isParticipatingAsContestant: true, // Xung đột lợi ích BR-21
  },
];

const INITIAL_ASSIGNMENTS: CategoryAssignment[] = [
  {
    categoryId: "cat-bw",
    categoryName: "Ảnh Đen Trắng (B&W)",
    roundName: "Vòng Sơ Loại & Chung Khảo",
    assignedJudgeIds: ["judge-1", "judge-4", "judge-2"],
  },
  {
    categoryId: "cat-street",
    categoryName: "Ảnh Đường Phố (Street Life)",
    roundName: "Vòng Chấm Điểm Chính Thức",
    assignedJudgeIds: ["judge-1", "judge-3"], // Chỉ có 2 giám khảo -> Cảnh báo BR-20
  },
  {
    categoryId: "cat-landscape",
    categoryName: "Ảnh Phong Cảnh & Thiên Nhiên",
    roundName: "Vòng Chấm Điểm Chính Thức",
    assignedJudgeIds: ["judge-2", "judge-4", "judge-3"],
  },
  {
    categoryId: "cat-portrait",
    categoryName: "Chân Dung Phim Màu",
    roundName: "Vòng Chấm Điểm Chính Thức",
    assignedJudgeIds: ["judge-2", "judge-3", "judge-1"],
  },
];

export default function CategoryAssignmentPage() {
  const [assignments, setAssignments] =
    useState<CategoryAssignment[]>(INITIAL_ASSIGNMENTS);
  const [selectedContest, setSelectedContest] = useState("fpc-2026-national");
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const contestSelectId = useId();

  // Tự động ẩn thông báo sau 4 giây
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleAddJudgeToCategory = (categoryId: string, judgeId: string) => {
    const judge = INITIAL_AVAILABLE_JUDGES.find((j) => j.id === judgeId);

    // Kiểm tra xung đột lợi ích BR-21
    if (judge?.isParticipatingAsContestant) {
      setToastType("error");
      setToastMessage(
        `Không thể phân công ${judge.fullName}: Tác giả này có bài dự thi trong cùng cuộc thi (Xung đột lợi ích BR-21 - MSG022).`,
      );
      return;
    }

    setAssignments((prev) =>
      prev.map((cat) => {
        if (cat.categoryId !== categoryId) return cat;
        if (cat.assignedJudgeIds.includes(judgeId)) return cat;
        return {
          ...cat,
          assignedJudgeIds: [...cat.assignedJudgeIds, judgeId],
        };
      }),
    );
  };

  const handleRemoveJudgeFromCategory = (
    categoryId: string,
    judgeId: string,
  ) => {
    setAssignments((prev) =>
      prev.map((cat) => {
        if (cat.categoryId !== categoryId) return cat;
        return {
          ...cat,
          assignedJudgeIds: cat.assignedJudgeIds.filter((id) => id !== judgeId),
        };
      }),
    );
  };

  const handleSaveAssignments = async () => {
    // Kiểm tra quy định Quorum BR-20
    const invalidCategories = assignments.filter(
      (cat) => cat.assignedJudgeIds.length < 3,
    );

    if (invalidCategories.length > 0) {
      setToastType("error");
      setToastMessage(
        `Cảnh báo BR-20: Hạng mục "${invalidCategories[0].categoryName}" chưa đủ tối thiểu 3 giám khảo hoạt động để mở vòng chấm!`,
      );
    }

    setSaving(true);
    try {
      try {
        await http.post(
          `/api/v1/contests/${selectedContest}/judges/assignments`,
          { assignments: assignments },
        );
      } catch (error) {
        console.error("Failed to save assignments:", error);
        setToastType("error");
        setToastMessage(
          "Không thể lưu phân công. API chưa sẵn sàng hoặc có lỗi kết nối.",
        );
        setSaving(false);
        return;
      }

      setToastType("success");
      setToastMessage(
        "Đã lưu cấu hình phân công giám khảo theo hạng mục thành công!",
      );
    } catch {
      setToastType("error");
      setToastMessage("Có lỗi xảy ra khi lưu phân công. Vui lòng thử lại!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Toast thông báo */}
      {toastMessage && (
        <output
          aria-live="polite"
          className={`fixed top-6 right-6 z-50 flex items-center gap-2 text-white px-4 py-3 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-4 ${
            toastType === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {toastType === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-sm font-medium">{toastMessage}</span>
        </output>
      )}

      {/* Điều hướng */}
      <div className="flex items-center justify-between">
        <Link
          href="/portal/contests"
          className="inline-flex items-center text-sm text-gray-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách cuộc thi
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> BR-20: Tối thiểu 3 Giám khảo
            / Hạng mục
          </span>
          <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> BR-21: Chống xung đột lợi
            ích
          </span>
        </div>
      </div>

      {/* Header tiêu đề */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Phân công Giám khảo vào Hạng mục thi (Category Assignment)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gán các chuyên gia giám khảo vào từng bảng thi và vòng chấm, đảm bảo
            tính độc lập và đáp ứng túc số đánh giá.
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

          <Button
            onClick={handleSaveAssignments}
            disabled={saving}
            className="bg-black hover:bg-gray-800 text-white flex items-center gap-2"
          >
            <Save className="w-4 h-4" />{" "}
            {saving ? "Đang lưu..." : "Lưu phân công"}
          </Button>
        </div>
      </div>

      {/* Danh sách các Hạng mục & Phân bổ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignments.map((cat) => {
          const isQuorumMet = cat.assignedJudgeIds.length >= 3;
          const assignedJudges = INITIAL_AVAILABLE_JUDGES.filter((j) =>
            cat.assignedJudgeIds.includes(j.id),
          );
          const unassignedJudges = INITIAL_AVAILABLE_JUDGES.filter(
            (j) => !cat.assignedJudgeIds.includes(j.id),
          );

          return (
            <Card
              key={cat.categoryId}
              className={`border transition-all ${
                isQuorumMet
                  ? "border-gray-200"
                  : "border-amber-300 bg-amber-50/20"
              }`}
            >
              <CardHeader className="pb-3 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="w-4 h-4 text-gray-600" />
                      {cat.categoryName}
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Vòng chấm: {cat.roundName}
                    </CardDescription>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                      isQuorumMet
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-100 text-amber-800 border-amber-300"
                    }`}
                  >
                    {cat.assignedJudgeIds.length} / 3 Giám khảo
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {/* Giám khảo đã gán */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Giám khảo được phân công:
                  </p>
                  {assignedJudges.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-2">
                      Chưa có giám khảo nào được phân công vào hạng mục này.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {assignedJudges.map((judge) => (
                        <div
                          key={judge.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-xs hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-stone-300 text-stone-800 flex items-center justify-center font-bold text-[10px]">
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
                              <p className="text-[11px] text-gray-500">
                                {judge.role}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveJudgeFromCategory(
                                cat.categoryId,
                                judge.id,
                              )
                            }
                            aria-label={`Xóa ${judge.fullName} khỏi ${cat.categoryName}`}
                            className="p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-white transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Thêm giám khảo */}
                {unassignedJudges.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-gray-700 mb-1.5">
                      Gán thêm giám khảo:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {unassignedJudges.map((judge) => {
                        const hasConflict = judge.isParticipatingAsContestant;
                        return (
                          <button
                            type="button"
                            key={judge.id}
                            onClick={() =>
                              handleAddJudgeToCategory(cat.categoryId, judge.id)
                            }
                            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border transition-colors ${
                              hasConflict
                                ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 line-through"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-black"
                            }`}
                            title={
                              hasConflict
                                ? "Cảnh báo BR-21: Xung đột lợi ích (Đã nộp bài thi vào cuộc thi này)"
                                : `Gán ${judge.fullName}`
                            }
                          >
                            <Plus className="w-3 h-3" />
                            {judge.fullName}
                            {hasConflict && (
                              <ShieldAlert className="w-3 h-3 text-rose-600 ml-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
