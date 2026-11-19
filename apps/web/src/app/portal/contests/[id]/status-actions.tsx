"use client";

import { CheckCircle2, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { http } from "@/lib/http";

export function ContestStatusActions({
  contestId,
  currentStatus,
}: {
  contestId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = (currentStatus ?? "").toLowerCase();

  async function handleUpdateStatus(newStatus: string) {
    const statusLabel =
      newStatus === "ongoing" ? "Mở nộp bài (OPEN/ONGOING)" : "Công bố kết quả (PUBLISHED)";

    if (
      !window.confirm(
        `Xác nhận chuyển trạng thái cuộc thi sang "${statusLabel}" theo quy trình State Machine?`,
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await http.put(`/api/v1/contests/${contestId}`, {
        status: newStatus,
      });
      router.refresh();
      window.location.reload();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr?.response?.data?.message || "Không thể chuyển trạng thái");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "draft" && (
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
          onClick={() => handleUpdateStatus("ongoing")}
          disabled={loading}
        >
          <Play className="w-3.5 h-3.5 mr-1" />
          {loading ? "Đang xử lý..." : "Mở nộp bài (Kích hoạt OPEN)"}
        </Button>
      )}

      {(status === "ongoing" || status === "open") && (
        <Button
          size="sm"
          variant="outline"
          className="border-blue-300 text-blue-700 hover:bg-blue-50 text-xs font-semibold"
          onClick={() => handleUpdateStatus("published")}
          disabled={loading}
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-blue-600" />
          {loading ? "Đang xử lý..." : "Công bố giải (PUBLISHED)"}
        </Button>
      )}

      {error && <span className="text-xs text-red-600 font-medium">{error}</span>}
    </div>
  );
}
