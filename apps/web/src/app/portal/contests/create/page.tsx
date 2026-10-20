"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

import { http } from "@/lib/http";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CreateContestPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // State lưu trữ dữ liệu form
  const [formData, setFormData] = useState({
    title: "",
    theme: "",
    description: "",
    submissionStart: "",
    submissionEnd: "",
    judgingStart: "",
    judgingEnd: "",
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
    if (!formData.title || !formData.theme || !formData.submissionStart || !formData.submissionEnd) {
      setError("Vui lòng điền đủ Tên, Chủ đề và Thời gian nộp bài.");
      return;
    }

    if (new Date(formData.submissionStart) >= new Date(formData.submissionEnd)) {
      setError("Ngày kết thúc nộp bài phải sau ngày bắt đầu.");
      return;
    }

    setIsLoading(true);

    try {
      // Gửi API lên Backend (Nhớ check lại endpoint với bạn làm BE)
      await http.post("/api/v1/contests", formData);
      
      alert("Tạo cuộc thi thành công!");
      router.push("/portal/contests"); // Quay về trang danh sách
      router.refresh(); // Load lại dữ liệu
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        "Tạo cuộc thi thất bại. Vui lòng kiểm tra lại kết nối Backend!"
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
              Thiết lập thông tin cơ bản, thời gian nộp bài và chấm thi cho cuộc thi nhiếp ảnh phim.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* THÔNG TIN CƠ BẢN */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">1. Thông tin cơ bản</h3>
              
              <div className="space-y-2">
                <Label htmlFor="title">Tên cuộc thi <span className="text-red-500">*</span></Label>
                <Input id="title" name="title" placeholder="VD: Cuộc thi Nhiếp ảnh Phim Mùa Thu 2026" value={formData.title} onChange={handleChange} required />
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

            {/* THỜI GIAN NỘP BÀI */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">2. Thời gian nộp bài <span className="text-red-500">*</span></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="submissionStart">Bắt đầu nhận bài</Label>
                  <Input type="datetime-local" id="submissionStart" name="submissionStart" value={formData.submissionStart} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="submissionEnd">Kết thúc nhận bài</Label>
                  <Input type="datetime-local" id="submissionEnd" name="submissionEnd" value={formData.submissionEnd} onChange={handleChange} required />
                </div>
              </div>
            </div>

            {/* THỜI GIAN CHẤM THI */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">3. Thời gian chấm thi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="judgingStart">Bắt đầu chấm</Label>
                  <Input type="datetime-local" id="judgingStart" name="judgingStart" value={formData.judgingStart} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="judgingEnd">Kết thúc chấm & Công bố</Label>
                  <Input type="datetime-local" id="judgingEnd" name="judgingEnd" value={formData.judgingEnd} onChange={handleChange} />
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