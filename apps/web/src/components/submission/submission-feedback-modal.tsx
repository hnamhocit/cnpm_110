"use client";

import { Award, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { http } from "@/lib/http/client";
import type { MySubmissionItem } from "@/types/my-submission";

interface FeedbackData {
  averageScore?: number | null;
  rank?: number | null;
  award?: string | null;
  status?: string;
  feedback?: Array<{
    judgeName?: string;
    comment: string;
    createdAt?: string;
  }>;
}

interface SubmissionFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: MySubmissionItem | null;
}

export function SubmissionFeedbackModal({
  open,
  onOpenChange,
  submission,
}: SubmissionFeedbackModalProps) {
  const [data, setData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && submission) {
      setLoading(true);
      setError(null);
      http
        .get(`/api/v1/submissions/${submission.id}/feedback`)
        .then((res) => {
          setData(res.data?.data ?? res.data);
        })
        .catch(() => {
          // If no feedback yet, show empty state
          setData(null);
          setError("Chưa có nhận xét hoặc kết quả chính thức từ ban giám khảo.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, submission]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white">
        <DialogHeader>
          <div className="flex items-center gap-2 text-indigo-600">
            <Award className="size-5" />
            <DialogTitle className="text-xl font-bold">
              Kết quả & Nhận xét Ban Giám Khảo (UC-41)
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-slate-500">
            Tác phẩm: <span className="font-semibold text-slate-800">{submission?.title}</span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Đang tải dữ liệu chấm thi...
          </div>
        ) : error ? (
          <div className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-600 border border-slate-200">
            {error}
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-blue-50 p-4 border border-blue-100 text-center">
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  Điểm trung bình
                </span>
                <p className="mt-1 text-2xl font-black text-blue-900">
                  {data.averageScore != null ? Number(data.averageScore).toFixed(1) : "—"}
                  <span className="text-sm font-normal text-blue-600"> / 10</span>
                </p>
              </div>

              <div className="rounded-lg bg-amber-50 p-4 border border-amber-100 text-center">
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                  Giải thưởng / Hạng
                </span>
                <p className="mt-1 text-base font-bold text-amber-900">
                  {data.award || (data.rank ? `Hạng ${data.rank}` : "Tác phẩm dự thi")}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Nhận xét chuyên môn (Blind Judging):
              </h4>
              {data.feedback && data.feedback.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {data.feedback.map((fb, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 space-y-1"
                    >
                      <div className="flex items-center gap-1 text-amber-600 font-semibold">
                        <Star className="size-3.5 fill-amber-500 text-amber-500" />
                        <span>Giám khảo {idx + 1}</span>
                      </div>
                      <p className="italic leading-relaxed">&ldquo;{fb.comment}&rdquo;</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Chưa có nhận xét chi tiết dạng văn bản.
                </p>
              )}
            </div>
          </div>
        ) : null}

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
