"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { http } from "@/lib/http";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Contest = {
  id: string;
  title: string;
  status: "DRAFT" | "ACTIVE" | "JUDGING" | "COMPLETED";
  startDate: string;
  endDate: string;
  participantsCount?: number;
};

export default function OrganizerContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true);
        const res = await http.get("/api/v1/contests"); 
        setContests(res.data.data || res.data); // Tùy thuộc BE bọc data hay không
      } catch (err: any) {
        setError(err.response?.data?.message || "Không thể tải danh sách cuộc thi");
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric"
    });
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Cuộc thi</h1>
          <p className="text-sm text-gray-500">Danh sách các cuộc thi nhiếp ảnh phim bạn đang tổ chức.</p>
        </div>
        {/* Nút tạo cuộc thi mới (Dẫn đến trang tạo) */}
        <Link href="/portal/contests/create">
          <Button className="bg-black text-white hover:bg-gray-800">
            + Tạo cuộc thi mới
          </Button>
        </Link>
      </div>

      {/* Danh sách cuộc thi */}
      {contests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            Bạn chưa có cuộc thi nào. Hãy tạo cuộc thi đầu tiên!
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contests.map((contest) => (
            <Card key={contest.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{contest.title}</CardTitle>
                  {/* Badge trạng thái */}
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    contest.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    contest.status === 'JUDGING' ? 'bg-yellow-100 text-yellow-700' :
                    contest.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {contest.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>📅 Thời gian: {formatDate(contest.startDate)} - {formatDate(contest.endDate)}</p>
                  <p>👥 Người tham gia: {contest.participantsCount || 0}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/portal/contests/${contest.id}`} className="flex-1">
                    <Button variant="outline" className="w-full text-xs">Xem chi tiết</Button>
                  </Link>
                  <Link href={`/portal/contests/${contest.id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full text-xs">Chỉnh sửa</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}