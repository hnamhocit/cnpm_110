"use client";

import { ArrowLeft, Camera, Film, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { http } from "@/lib/http/client";

type ContestOption = {
  id: string;
  name?: string;
  title?: string;
};

export default function NewSubmissionPage() {
  const router = useRouter();
  const [contests, setContests] = useState<ContestOption[]>([]);
  const [contestId, setContestId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Thông số phim Analog (BR-22)
  const [cameraModel, setCameraModel] = useState("");
  const [lensModel, setLensModel] = useState("");
  const [filmStock, setFilmStock] = useState("Kodak Portra 400");
  const [filmFormat, setFilmFormat] = useState("135 (35mm)");
  const [isoRated, setIsoRated] = useState("400");
  const [frameNumber, setFrameNumber] = useState("12");
  const [labName, setLabName] = useState("");
  const [scannerModel, setScannerModel] = useState("Noritsu HS-1800");

  // File ảnh scan & âm bản
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadContests() {
      try {
        const res = await http.get("/api/v1/contests");
        const raw = res.data?.data ?? res.data;
        const items: ContestOption[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.items)
            ? raw.items
            : [];
        setContests(items);
        if (items.length > 0 && items[0]?.id) {
          setContestId(items[0].id);
        }
      } catch {
        // Giữ form hoạt động ngay cả khi chưa tải được danh sách
      }
    }
    loadContests();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Ảnh scan vượt quá giới hạn 25MB theo quy chuẩn BR-07.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contestId.trim()) {
      toast.error("Vui lòng chọn cuộc thi tham gia.");
      return;
    }
    if (!title.trim() || !imageFile) {
      toast.error("Vui lòng nhập tên tác phẩm và chọn ảnh dự thi.");
      return;
    }
    if (!cameraModel.trim() || !filmStock.trim() || !frameNumber.trim()) {
      toast.error("Vui lòng điền đầy đủ thông số máy ảnh, loại phim và số frame.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("contestId", contestId);
      formData.append("title", title.trim());
      if (description.trim()) formData.append("description", description.trim());
      formData.append("image", imageFile);
      if (proofFile) formData.append("negativeProof", proofFile);

      formData.append("cameraModel", cameraModel.trim());
      if (lensModel.trim()) formData.append("lensModel", lensModel.trim());
      formData.append("filmStock", filmStock.trim());
      formData.append("filmFormat", filmFormat);
      formData.append("isoRated", isoRated || "400");
      formData.append("frameNumber", frameNumber.trim());
      if (labName.trim()) formData.append("labName", labName.trim());
      if (scannerModel.trim()) formData.append("scannerModel", scannerModel.trim());

      await http.post("/api/v1/submissions", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Nộp bài dự thi thành công! Hệ thống đang quét AI.");
      router.push("/my-submissions");
    } catch {
      toast.error("Không thể nộp bài. Vui lòng kiểm tra đăng nhập hoặc định dạng file.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Nộp bài thi ảnh Analog
          </h1>
          <p className="text-sm text-slate-500">
            Tải lên ảnh scan độ phân giải cao kèm thông số kỹ thuật chụp & tráng phim (BR-07, BR-22).
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/my-submissions">Bài thi của tôi</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Trang chủ
            </Link>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4 text-blue-600" />
              1. Thông tin tác phẩm & Ảnh scan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="contestId">Cuộc thi *</Label>
                <select
                  id="contestId"
                  value={contestId}
                  onChange={(e) => setContestId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                >
                  {contests.length === 0 ? (
                    <option value="">-- Đang tải hoặc chưa có cuộc thi --</option>
                  ) : (
                    contests.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.title || c.id}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="title">Tên tác phẩm *</Label>
                <Input
                  id="title"
                  placeholder="VD: Nắng sớm Hội An"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Câu chuyện / Mô tả tác phẩm</Label>
              <Input
                id="description"
                placeholder="Bối cảnh chụp, cảm hứng sáng tác..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="scanImage">Ảnh scan dự thi * (JPG/TIFF/PNG, tối đa 25MB)</Label>
                <Input
                  id="scanImage"
                  type="file"
                  accept="image/jpeg,image/png,image/tiff"
                  onChange={handleImageChange}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proofImage">Ảnh dải phim âm bản (tùy chọn)</Label>
                <Input
                  id="proofImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            {imagePreview ? (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2">
                <img
                  src={imagePreview}
                  alt="Preview ảnh dự thi"
                  className="max-h-64 w-full rounded object-contain"
                />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="h-4 w-4 text-blue-600" />
              2. Thông số máy ảnh & Cuộn phim (BR-22)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cameraModel">Thân máy (Camera) *</Label>
              <Input
                id="cameraModel"
                placeholder="VD: Leica M6 / Nikon FM2"
                value={cameraModel}
                onChange={(e) => setCameraModel(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lensModel">Ống kính (Lens)</Label>
              <Input
                id="lensModel"
                placeholder="VD: Summicron 35mm f/2"
                value={lensModel}
                onChange={(e) => setLensModel(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filmStock">Loại phim (Film Stock) *</Label>
              <Input
                id="filmStock"
                value={filmStock}
                onChange={(e) => setFilmStock(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filmFormat">Khổ phim (Format) *</Label>
              <select
                id="filmFormat"
                value={filmFormat}
                onChange={(e) => setFilmFormat(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="135 (35mm)">135 (35mm)</option>
                <option value="120 (Medium Format)">120 (Medium Format)</option>
                <option value="4x5 (Large Format)">4x5 (Large Format)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="isoRated">ISO</Label>
              <Input
                id="isoRated"
                type="number"
                value={isoRated}
                onChange={(e) => setIsoRated(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="frameNumber">Số Frame trên cuộn *</Label>
              <Input
                id="frameNumber"
                placeholder="VD: 12"
                value={frameNumber}
                onChange={(e) => setFrameNumber(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Film className="h-4 w-4 text-blue-600" />
              3. Tráng rọi & Scan (Lab Info)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="labName">Phòng Lab tráng phim</Label>
              <Input
                id="labName"
                placeholder="VD: Llab Saigon / Croplab"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scannerModel">Thiết bị Scan</Label>
              <Input
                id="scannerModel"
                value={scannerModel}
                onChange={(e) => setScannerModel(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
            {submitting ? "Đang tải lên & kiểm duyệt..." : "Nộp bài dự thi"}
          </Button>
        </div>
      </form>
    </div>
  );
}

