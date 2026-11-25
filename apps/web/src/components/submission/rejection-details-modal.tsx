"use client";

import { AlertOctagon, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type RejectionDetailsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissionTitle: string;
  rejectionReason?: string | null;
  aiFlagged?: boolean;
};

export function RejectionDetailsModal({
  open,
  onOpenChange,
  submissionTitle,
  rejectionReason,
  aiFlagged,
}: RejectionDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-600">
            <AlertOctagon className="h-5 w-5" />
            <DialogTitle>Chi tiết lý do từ chối bài thi</DialogTitle>
          </div>
          <DialogDescription>
            Tác phẩm: <span className="font-semibold text-slate-900">{submissionTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm">
          {aiFlagged ? (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-xs leading-relaxed">
                Hệ thống AI phát hiện dấu hiệu bất thường (can thiệp kỹ thuật số, trùng lặp pHash hoặc nghi vấn ảnh AI).
              </p>
            </div>
          ) : null}

          <div className="rounded-lg border border-red-200 bg-red-50/70 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-700">
              Phiếu giải trình từ Ban Tổ Chức
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-800">
              {rejectionReason?.trim() ||
                "Bài thi không đáp ứng tiêu chuẩn ảnh phim analog hoặc quá hạn bổ sung bằng chứng âm bản (BR-19)."}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

