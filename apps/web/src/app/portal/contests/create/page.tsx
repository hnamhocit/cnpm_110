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
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";

export default function CreateContestPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    theme: "",
    description: "",
    submissionStart: "",
    submissionEnd: "",
    judgingStart: "",
    judgingEnd: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title || !formData.theme || !formData.submissionStart || !formData.submissionEnd) {
      setError("Vui lòng điền đủ Tên, Chủ đề và Thời gian nộp bài.");
      return;
    }

    setIsLoading(true);

    try {
      await http.post("/api/v1/contests", formData);
      alert("Tạo cuộc thi thành công!");
      router.push("/portal/contests");
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.message || "Tạo cuộc thi thất bại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/portal/contests" className="inline-flex items-center text-sm text-gray-500 hover:text-black">
        <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
      </Link>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl">Tạo cuộc thi mới</CardTitle>
            <CardDescription>Thiết lập thông tin cơ bản cho cuộc thi.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">1. Thông tin cơ bản</h3>
              <div className="space-y-2">
                <Label htmlFor="title">Tên cuộc thi <span className="text-red-500">*</span></Label>
                <Input id="title" name="title" placeholder="VD: Cuộc thi Nhiếp ảnh Phim 2026" value={formData.title} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="theme">Chủ đề <span className="text-red-500">*</span></Label>
                <Input id="theme" name="theme" placeholder="VD: Góc phố Hà Nội" value={formData.theme} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Thể lệ</Label>
                <textarea id="description" name="description" className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Nhập thể lệ..." value={formData.description} onChange={handleChange} />
              </div>
            </div>

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

            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">3. Thời gian chấm thi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="judgingStart">Bắt đầu chấm</Label>
                  <Input type="datetime-local" id="judgingStart" name="judgingStart" value={formData.judgingStart} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="judgingEnd">Kết thúc chấm</Label>
                  <Input type="datetime-local" id="judgingEnd" name="judgingEnd" value={formData.judgingEnd} onChange={handleChange} />
                </div>
              </div>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 border border-red-200 text-sm">{error}</div>}
          </CardContent>

          <CardFooter className="flex justify-end gap-4 border-t p-6">
            <Link href="/portal/contests"><Button type="button" variant="outline">Hủy</Button></Link>
            <Button type="submit" disabled={isLoading} className="bg-black text-white gap-2">
              {isLoading ? "Đang lưu..." : <><Save className="w-4 h-4" /> Lưu cuộc thi</>}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}