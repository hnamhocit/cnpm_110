"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  FilmLab,
  MasterDataEntity,
  MasterDataRecord,
} from "@/types/master-data";
import { ENTITY_LABELS } from "@/types/master-data";

type SoftDeleteDialogProps = {
  entity: MasterDataEntity;
  target: MasterDataRecord | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function recordLabel(record: MasterDataRecord): string {
  if ("model" in record) return `${record.brand} ${record.model}`;
  if ("brand" in record) return `${record.brand} ${record.name}`;
  return (record as FilmLab).name;
}

export function SoftDeleteDialog({
  entity,
  target,
  busy,
  onCancel,
  onConfirm,
}: SoftDeleteDialogProps) {
  return (
    <Dialog
      open={Boolean(target)}
      onOpenChange={(open) => {
        if (!open && !busy) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600" />
            Xóa mềm {ENTITY_LABELS[entity].singular}
          </DialogTitle>
          <DialogDescription>
            Hành động này chuyển bản ghi sang trạng thái “Ngừng lưu hành”
            (soft-delete). Dữ liệu lịch sử của cuộn phim và bài dự thi đã liên
            kết sẽ không bị ảnh hưởng (BR-03).
          </DialogDescription>
        </DialogHeader>

        {target && (
          <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <p className="font-medium">{recordLabel(target)}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {target.code}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={busy}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Đang xử lý…" : "Đồng ý xóa mềm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
