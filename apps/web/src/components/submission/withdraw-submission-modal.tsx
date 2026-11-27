"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";
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

interface WithdrawSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: MySubmissionItem | null;
  onSuccess: () => void;
}

export function WithdrawSubmissionModal({
  open,
  onOpenChange,
  submission,
  onSuccess,
}: WithdrawSubmissionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWithdraw = async () => {
    if (!submission) return;
    try {
      setLoading(true);
      setError(null);
      await http.post(`/api/v1/submissions/${submission.id}/withdraw`);
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Không thể rút bài dự thi. Vui lòng kiểm tra lại điều kiện.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="size-5" />
            <DialogTitle className="text-lg font-bold">
              Xác nhận rút bài dự thi (BR-24)
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-slate-600 pt-2 leading-relaxed">
            Bạn có chắc chắn muốn rút tác phẩm{" "}
            <span className="font-semibold text-slate-900">
              &quot;{submission?.title}&quot;
            </span>{" "}
            khỏi cuộc thi không?
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-amber-50 p-3.5 border border-amber-200 text-xs text-amber-900 space-y-1">
          <p className="font-semibold">Lưu ý quan trọng theo thể lệ (BR-24):</p>
          <ul className="list-disc list-inside space-y-0.5 text-amber-800">
            <li>Sau khi rút bài, tác phẩm sẽ bị đánh dấu rút lui và không được chấm điểm.</li>
            <li>Hành động này không thể hoàn tác sau khi đã thực hiện.</li>
            <li>Chỉ áp dụng khi cuộc thi chưa đóng sổ và bài chưa bước vào vòng chấm điểm.</li>
          </ul>
        </div>

        {error ? (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        ) : null}

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleWithdraw}
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Xác nhận rút bài"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
