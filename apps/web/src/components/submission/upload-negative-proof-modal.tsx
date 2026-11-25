"use client";

import { FileImage, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { http } from "@/lib/http/client";

type UploadNegativeProofModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissionId: string;
  submissionTitle: string;
  onSuccess?: () => void;
};

export function UploadNegativeProofModal({
  open,
  onOpenChange,
  submissionId,
  submissionTitle,
  onSuccess,
}: UploadNegativeProofModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    if (selected) {
      setPreviewUrl(URL.createObjectURL(selected));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Vui lòng chọn ảnh dải phim âm bản đối chứng.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("proof", file);
      formData.append("negativeProof", file);

      await http.post(`/api/v1/submissions/${submissionId}/proof`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Đã tải lên bằng chứng âm bản thành công!");
      setFile(null);
      setPreviewUrl(null);
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Không thể tải lên bằng chứng âm bản. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Nộp bổ sung bằng chứng âm bản (BR-19)
          </DialogTitle>
          <DialogDescription>
            Tác phẩm: <span className="font-semibold text-slate-900">{submissionTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="negative-proof-file">Ảnh chụp dải phim âm bản / slide gốc</Label>
            <Input
              id="negative-proof-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          {previewUrl ? (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2">
              <img
                src={previewUrl}
                alt="Preview bằng chứng âm bản"
                className="max-h-48 w-full rounded object-contain"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 py-8 text-xs text-slate-500">
              <FileImage className="mb-2 h-8 w-8 text-slate-400" />
              <span>Chọn ảnh chụp dải phim âm bản rõ nét (JPG/PNG)</span>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={submitting || !file}>
              {submitting ? "Đang tải lên..." : "Xác nhận nộp âm bản"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

