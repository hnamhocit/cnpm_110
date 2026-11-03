"use client";

import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { http } from "@/lib/http";

export default function CreateContestPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // State lưu trữ dữ liệu form với đầy đủ 7 timestamps theo hợp đồng DTO
  const [formData, setFormData] = useState({
    name: "",
    theme: "",
    description: "",
    registrationStart: "",
    registrationEnd: "",
    submissionStart: "",
    submissionEnd: "",
    judgingStart: "",
    judgingEnd: "",
    resultsAnnounced: "",
  });

  // Hàm cập nhật state khi gõ
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Hàm submit form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate cơ bản - kiểm tra các trường bắt buộc
    if (
      !formData.name ||
      !formData.theme ||
      !formData.registrationStart ||
      !formData.registrationEnd ||
      !formData.submissionStart ||
      !formData.submissionEnd ||
      !formData.judgingStart ||
      !formData.judgingEnd
    ) {
      setError(
        "Vui lòng điền đủ các trường bắt buộc: Tên, Chủ đề, và tất cả các mốc thời gian.",
      );
      return;
    }

    // Validate timeline order: registrationStart < registrationEnd < submissionStart < submissionEnd < judgingStart < judgingEnd
    const regStart = new Date(formData.registrationStart);
    const regEnd = new Date(formData.registrationEnd);
    const subStart = new Date(formData.submissionStart);
    const subEnd = new Date(formData.submissionEnd);
    const judgeStart = new Date(formData.judgingStart);
    const judgeEnd = new Date(formData.judgingEnd);

    if (regStart >= regEnd) {
      setError("Thời gian kết thúc đăng ký phải sau thời gian bắt đầu đăng ký.");
      return;
    }

    if (regEnd >= subStart) {
      setError("Thời gian bắt đầu nộp bài phải sau thời gian kết thúc đăng ký.");
      return;
    }

    if (subStart >= subEnd) {
      setError("Thời gian kết thúc nộp bài phải sau thời gian bắt đầu nộp bài.");
      return;
    }

    if (subEnd >= judgeStart) {
      setError("Thời gian bắt đầu chấm thi phải sau thời gian kết thúc nộp bài.");
      return;
    }

    if (judgeStart >= judgeEnd) {
      setError("Thời gian kết thúc chấm thi phải sau thời gian bắt đầu chấm thi.");
      return;
    }

    setIsLoading(true);

    try {
      // shortcut: DTO chưa có field theme, gộp tạm vào description; tách khi backend bổ sung.
      const description = [
        formData.theme && `Chủ đề: ${formData.theme}`,
        formData.description,
      ]
        .filter(Boolean)
        .join("\n\n");

      // Gửi API theo hợp đồng Bug 06: field name (không phải title), endpoint /api/v1/contests
      await http.post("/api/v1/contests", {
        name: formData.name.trim(),
        description: description || null,
        registrationStart: regStart.toISOString(),
        registrationEnd: regEnd.toISOString(),
        submissionStart: subStart.toISOString(),
        submissionEnd: subEnd.toISOString(),
        judgingStart: judgeStart.toISOString(),
        judgingEnd: judgeEnd.toISOString(),
        resultsAnnounced: formData.resultsAnnounced
          ? new Date(formData.resultsAnnounced).toISOString()
          : null,
      });

      router.push("/portal/contests");
      router.refresh();
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(
        message ??
          "Tạo cuộc thi thất bại. Vui lòng kiểm tra lại kết nối Backend!",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Nút quay lại */}
      <Link
        href="/portal/contests"
        className="inline-flex items-center text-sm text-gray-500 hover:text-black"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
      </Link>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl">Tạo cuộc thi mới</CardTitle>
            <CardDescription>
              Thiết lập thông tin cơ bản, thời gian đăng ký, nộp bài và chấm thi
              cho cuộc thi nhiếp ảnh phim.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* THÔNG TIN CƠ BẢN */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                1. Thông tin cơ bản
              </h3>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Tên cuộc thi <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="VD: Cuộc thi Nhiếp ảnh Phim Mùa Thu 2026"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">
                  Chủ đề <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="theme"
                  name="theme"
                  placeholder="VD: Góc phố Hà Nội, Vẻ đẹp phụ nữ..."
                  value={formData.theme}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Thể lệ & Mô tả chi tiết</Label>
                <textarea
                  id="description"
                  name="description"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Nhập thể lệ cuộc thi, quy định về ảnh phim, kích thước..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* THỜI GIAN ĐĂNG KÝ */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                2. Thời gian đăng ký <span className="text-red-500">*</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationStart">Bắt đầu đăng ký</Label>
                  <Input
                    type="datetime-local"
                    id="registrationStart"
                    name="registrationStart"
                    value={formData.registrationStart}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationEnd">Kết thúc đăng ký</Label>
                  <Input
                    type="datetime-local"
                    id="registrationEnd"
                    name="registrationEnd"
                    value={formData.registrationEnd}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* THỜI GIAN NỘP BÀI */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                3. Thời gian nộp bài <span className="text-red-500">*</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="submissionStart">Bắt đầu nhận bài</Label>
                  <Input
                    type="datetime-local"
                    id="submissionStart"
                    name="submissionStart"
                    value={formData.submissionStart}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="submissionEnd">Kết thúc nhận bài</Label>
                  <Input
                    type="datetime-local"
                    id="submissionEnd"
                    name="submissionEnd"
                    value={formData.submissionEnd}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* THỜI GIAN CHẤM THI */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                4. Thời gian chấm thi <span className="text-red-500">*</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="judgingStart">Bắt đầu chấm</Label>
                  <Input
                    type="datetime-local"
                    id="judgingStart"
                    name="judgingStart"
                    value={formData.judgingStart}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="judgingEnd">Kết thúc chấm</Label>
                  <Input
                    type="datetime-local"
                    id="judgingEnd"
                    name="judgingEnd"
                    value={formData.judgingEnd}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* CÔNG BỐ KẾT QUẢ (Optional) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                5. Công bố kết quả (tùy chọn)
              </h3>
              <div className="space-y-2">
                <Label htmlFor="resultsAnnounced">Thời gian công bố</Label>
                <Input
                  type="datetime-local"
                  id="resultsAnnounced"
                  name="resultsAnnounced"
                  value={formData.resultsAnnounced}
                  onChange={handleChange}
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200 text-sm font-medium">
                {error}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-4 border-t p-6">
            <Link href="/portal/contests">
              <Button type="button" variant="outline">
                Hủy
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-black text-white gap-2"
            >
              {isLoading ? (
                "Đang lưu..."
              ) : (
                <>
                  <Save className="w-4 h-4" /> Lưu cuộc thi
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
