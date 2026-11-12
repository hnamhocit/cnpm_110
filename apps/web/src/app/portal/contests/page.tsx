"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatContestDate } from "@/lib/contest-utils";
import { http } from "@/lib/http";

// API hiện trả snake_case; DTO hợp đồng dùng camelCase.
type Contest = {
  id: string;
  name?: string | null;
  status?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  start_at?: string | null;
  end_at?: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  ongoing: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
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
        const raw = res.data?.data ?? res.data;
        const items = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.items)
            ? raw.items
            : Array.isArray(res.data?.items)
              ? res.data.items
              : [];
        setContests(items);
      } catch (err: unknown) {
        const apiErr = err as { response?: { data?: { message?: string } } };
        setError(
          apiErr.response?.data?.message || "Không thể tải danh sách cuộc thi",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, []);

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
    );
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Quản lý Cuộc thi
          </h1>
          <p className="text-sm text-gray-500">
            Danh sách các cuộc thi nhiếp ảnh phim bạn đang tổ chức.
          </p>
        </div>
        {/* Nút tạo cuộc thi mới (Dẫn đến trang tạo) */}
        <Link href="/portal/contests/create">
          <Button className="bg-black text-white hover:bg-gray-800">
            + Tạo cuộc thi mới
          </Button>
        </Link>
      </div>

      {/* Danh sách cuộc thi */}
      {(!Array.isArray(contests) || contests.length === 0) ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            Bạn chưa có cuộc thi nào. Hãy tạo cuộc thi đầu tiên!
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Array.isArray(contests) ? contests : []).map((contest) => {
            const status = (contest.status ?? "").toLowerCase() || "n/a";

            return (
              <Card
                key={contest.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      {contest.name || "N/A"}
                    </CardTitle>
                    {/* Badge trạng thái */}
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${STATUS_STYLES[status] ?? "bg-blue-100 text-blue-700"}`}
                    >
                      {status.toUpperCase()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      📅 Thời gian:{" "}
                      {formatContestDate(contest.startAt ?? contest.start_at)} -{" "}
                      {formatContestDate(contest.endAt ?? contest.end_at)}
                    </p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/portal/contests/${contest.id}`}
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full text-xs">
                        Chi tiết cuộc thi
                      </Button>
                    </Link>
                    <Link
                      href={`/portal/contests/${contest.id}/submissions`}
                      className="flex-1"
                    >
                      <Button className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white">
                        Bài dự thi
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
