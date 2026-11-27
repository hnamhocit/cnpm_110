"use client";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { http } from "@/lib/http/client";
import type { MySubmissionItem } from "@/types/my-submission";

interface EditSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: MySubmissionItem | null;
  onSuccess: () => void;
}

export function EditSubmissionModal({
  open,
  onOpenChange,
  submission,
  onSuccess,
}: EditSubmissionModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filmBrand, setFilmBrand] = useState("");
  const [cameraModel, setCameraModel] = useState("");
  const [lensModel, setLensModel] = useState("");
  const [labName, setLabName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (submission) {
      setTitle(submission.title || "");
      setDescription(submission.description || "");
      setFilmBrand(submission.filmMetadata?.filmStock || "");
      setCameraModel(submission.filmMetadata?.cameraModel || "");
      setLensModel(submission.filmMetadata?.lensModel || "");
      setLabName(submission.filmMetadata?.labName || "");
      setError(null);
    }
  }, [submission]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission) return;
    if (!title.trim()) {
      setError("Tiêu đề tác phẩm không được để trống.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await http.patch(`/api/v1/submissions/${submission.id}`, {
        title: title.trim(),
        description: description.trim(),
        filmBrand: filmBrand.trim(),
        cameraModel: cameraModel.trim(),
        lensModel: lensModel.trim(),
        labName: labName.trim(),
      });
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Không thể cập nhật bài dự thi. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Chỉnh sửa thông số bài thi (BR-24)
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Thí sinh có thể hiệu chỉnh metadata trước hạn chót và khi bài chưa vào
            vòng chấm điểm.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold text-slate-700">
              Tiêu đề tác phẩm *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề ảnh"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-slate-700">
              Mô tả / Tuyên ngôn nghệ thuật
            </Label>
            <textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="Thông điệp gửi gắm qua bức ảnh"
              rows={3}
              className="w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-slate-400 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="camera" className="text-xs font-semibold text-slate-700">
                Thân máy (Camera)
              </Label>
              <Input
                id="camera"
                value={cameraModel}
                onChange={(e) => setCameraModel(e.target.value)}
                placeholder="VD: Leica M6, Canon AE-1"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lens" className="text-xs font-semibold text-slate-700">
                Ống kính (Lens)
              </Label>
              <Input
                id="lens"
                value={lensModel}
                onChange={(e) => setLensModel(e.target.value)}
                placeholder="VD: 50mm f/1.4"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="film" className="text-xs font-semibold text-slate-700">
                Loại phim (Film Stock)
              </Label>
              <Input
                id="film"
                value={filmBrand}
                onChange={(e) => setFilmBrand(e.target.value)}
                placeholder="VD: Kodak Portra 400"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lab" className="text-xs font-semibold text-slate-700">
                Phòng Lab tráng scan
              </Label>
              <Input
                id="lab"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                placeholder="VD: LLab, Croplab"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
