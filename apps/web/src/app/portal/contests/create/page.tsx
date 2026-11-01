"use client";

import axios from "axios";
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

  // State lưu trữ dữ liệu form
  const [formData, setFormData] = useState({
    name: "",
    theme: "",
    description: "",
    startAt: "",
    endAt: "",
  });

  // Hàm cập nhật state khi gõ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Hàm submit form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate cơ bản
    if (!formData.name || !formData.startAt || !formData.endAt) {
      setError("Vui lòng điền đủ Tên và Thời gian cuộc thi.");
      return;
    }

    if (new Date(formData.startAt) >= new Date(formData.endAt)) {
      setError("Thời gian kết thúc phải sau thời gian bắt đầu.");
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

      await http.post("/contests", {
        name: formData.name.trim(),
        description: description || null,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
      });

      alert("Tạo cuộc thi thành công!");
      router.push("/portal/contests"); // Quay về trang danh sách
      router.refresh(); // Load lại dữ liệu
    } catch (err) {
      const message = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : undefined;

      setError(
        message ?? "Tạo cuộc thi thất bại. Vui lòng kiểm tra lại kết nối Backend!",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Nút quay lại */}
      <Link href="/portal/contests" className="inline-flex items-center text-sm text-gray-500 hover:text-black">
        <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
      </Link>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl">Tạo cuộc thi mới</CardTitle>
            <CardDescription>
              Thiết lập thông tin cơ bản và thời gian cho cuộc thi nhiếp ảnh phim.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* THÔNG TIN CƠ BẢN */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">1. Thông tin cơ bản</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Tên cuộc thi <span className="text-red-500">*</span></Label>
                <Input id="name" name="name" placeholder="VD: Cuộc thi Nhiếp ảnh Phim Mùa Thu 2026" value={formData.name} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Chủ đề <span className="text-red-500">*</span></Label>
                <Input id="theme" name="theme" placeholder="VD: Góc phố Hà Nội, Vẻ đẹp phụ nữ..." value={formData.theme} onChange={handleChange} required />
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

            {/* THỜI GIAN CUỘC THI */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">2. Thời gian cuộc thi <span className="text-red-500">*</span></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startAt">Bắt đầu</Label>
                  <Input type="datetime-local" id="startAt" name="startAt" value={formData.startAt} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endAt">Kết thúc</Label>
                  <Input type="datetime-local" id="endAt" name="endAt" value={formData.endAt} onChange={handleChange} required />
                </div>
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
              <Button type="button" variant="outline">Hủy</Button>
            </Link>
            <Button type="submit" disabled={isLoading} className="bg-black text-white gap-2">
              {isLoading ? "Đang lưu..." : <><Save className="w-4 h-4" /> Lưu cuộc thi</>}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}