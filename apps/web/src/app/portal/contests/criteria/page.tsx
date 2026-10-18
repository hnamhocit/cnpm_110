"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
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

// Kiểu dữ liệu cho một tiêu chí
type Criterion = {
  id: string;
  name: string;
  weight: number; // Trọng số (%)
};

export default function CriteriaConfigPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // State lưu danh sách tiêu chí. Khởi tạo sẵn 3 tiêu chí mẫu
  const [criteria, setCriteria] = useState<Criterion[]>([
    { id: "1", name: "Sáng tạo & Ý tưởng", weight: 40 },
    { id: "2", name: "Bố cục & Ánh sáng", weight: 30 },
    { id: "3", name: "Chất lượng kỹ thuật (Film/Scan)", weight: 30 },
  ]);

  // Tính tổng trọng số hiện tại
  const totalWeight = criteria.reduce((sum, item) => sum + Number(item.weight || 0), 0);

  // Thêm tiêu chí mới
  const handleAddCriterion = () => {
    setCriteria([
      ...criteria,
      { id: Date.now().toString(), name: "", weight: 0 },
    ]);
  };

  // Xóa tiêu chí
  const handleRemoveCriterion = (id: string) => {
    setCriteria(criteria.filter((item) => item.id !== id));
  };

  // Cập nhật giá trị khi gõ
  const handleChange = (id: string, field: "name" | "weight", value: string) => {
    setCriteria(
      criteria.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: field === "weight" ? Number(value) : value };
        }
        return item;
      })
    );
  };

  // Lưu cấu hình
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (criteria.some((c) => !c.name.trim())) {
      setError("Vui lòng nhập tên cho tất cả các tiêu chí.");
      return;
    }

    if (totalWeight !== 100) {
      setError(`Tổng trọng số phải bằng 100%. Hiện tại đang là ${totalWeight}%.`);
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Gửi API lên Backend (bạn có thể cập nhật endpoint sau)
      // await http.post("/api/v1/contests/1/criteria", { criteria });
      
      alert("Lưu cấu hình tiêu chí thành công!");
      // router.push("/portal/contests");
    } catch (err: any) {
      setError("Có lỗi xảy ra khi lưu.");
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
            <CardTitle className="text-2xl">Cấu hình tiêu chí chấm điểm</CardTitle>
            <CardDescription>
              Thiết lập các tiêu chí và gán trọng số phần trăm. Tổng trọng số bắt buộc phải bằng 100%.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {criteria.map((item, index) => (
              <div key={item.id} className="flex items-end gap-4 p-4 border rounded-lg bg-gray-50/50">
                <div className="flex-1 space-y-2">
                  <Label>Tên tiêu chí {index + 1}</Label>
                  <Input
                    placeholder="VD: Sáng tạo, Kỹ thuật..."
                    value={item.name}
                    onChange={(e) => handleChange(item.id, "name", e.target.value)}
                    required
                  />
                </div>
                <div className="w-32 space-y-2">
                  <Label>Trọng số (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={item.weight || ""}
                    onChange={(e) => handleChange(item.id, "weight", e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="mb-[2px]"
                  onClick={() => handleRemoveCriterion(item.id)}
                  disabled={criteria.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={handleAddCriterion} className="w-full border-dashed">
              <Plus className="w-4 h-4 mr-2" /> Thêm tiêu chí mới
            </Button>

            {/* Hiển thị tổng trọng số */}
            <div className={`mt-6 p-4 rounded-lg flex justify-between items-center border ${totalWeight === 100 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <span className="font-semibold">Tổng trọng số hiện tại:</span>
              <span className={`text-2xl font-bold ${totalWeight === 100 ? 'text-green-600' : 'text-red-600'}`}>
                {totalWeight}%
              </span>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200 text-sm font-medium">
                {error}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-4 border-t p-6">
            <Button type="submit" disabled={isLoading || totalWeight !== 100} className="bg-black text-white gap-2">
              {isLoading ? "Đang lưu..." : <><Save className="w-4 h-4" /> Lưu cấu hình</>}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}