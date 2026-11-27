"use client";

import { CheckCircle2, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PublishResultsDialog } from "@/components/results/publish-results-dialog";
import { Button } from "@/components/ui/button";
import { http } from "@/lib/http/client";

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
  const [publishOpen, setPublishOpen] = useState(false);

  const status = (currentStatus ?? "").toLowerCase();
  const isJudging =
    status === "judging" || status === "in_judging" || status.includes("judg");
  const isPublished = status === "results_published";

  async function handleUpdateStatus(newStatus: string) {
    const statusLabel = "Mở nộp bài (OPEN)";

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
      setError(
        apiErr?.response?.data?.message || "Không thể chuyển trạng thái",
      );
    } finally {
      setLoading(false);
    }
  }

  function handlePublishSuccess() {
    router.refresh();
    window.location.reload();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "draft" && (
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
          onClick={() => handleUpdateStatus("OPEN")}
          disabled={loading}
        >
          <Play className="w-3.5 h-3.5 mr-1" />
          {loading ? "Đang xử lý..." : "Mở nộp bài (Kích hoạt OPEN)"}
        </Button>
      )}

      {isJudging && (
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
          onClick={() => setPublishOpen(true)}
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          Chốt & công bố kết quả
        </Button>
      )}

      {isPublished && (
        <Button
          size="sm"
          variant="outline"
          className="border-emerald-200 text-emerald-700 text-xs font-semibold"
          disabled
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          Đã công bố (khóa)
        </Button>
      )}

      {error && (
        <span className="text-xs text-red-600 font-medium">{error}</span>
      )}

      <PublishResultsDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        contestId={contestId}
        onSuccess={handlePublishSuccess}
      />
    </div>
  );
}
