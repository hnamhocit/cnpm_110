"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { http } from "@/lib/http";

type Contest = { id: string; name: string };
type Counts = { submissions: number; aiWarnings: number; byStatus: Record<string, number> };
type Analytics = {
  contest: Contest;
  totals: Counts;
  categories: (Counts & { name: string })[];
  report: string | null;
};
type Envelope<T> = { data: T };

export default function ReportsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [contestId, setContestId] = useState("");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadContests() {
      try {
        const response = await fetch("/api/auth/me", { signal: controller.signal });
        const { user } = await response.json() as { user?: { id: string; role: string } };
        if (!response.ok || user?.role !== "Organizer") {
          setError("Báo cáo dành cho Ban tổ chức của cuộc thi.");
          return;
        }

        const items: Contest[] = [];
        let page = 1;
        let totalPages = 1;
        while (page <= totalPages) {
          const { data } = await http.get<Envelope<{
            items: Contest[];
            pagination: { totalPages: number };
          }>>("/api/v1/contests", {
            params: { createdBy: user.id, page, limit: 100 },
            signal: controller.signal,
          });
          items.push(...data.data.items);
          totalPages = data.data.pagination.totalPages;
          page += 1;
        }
        setContests(items);
        setContestId(items[0]?.id ?? "");
      } catch {
        if (!controller.signal.aborted) setError("Không thể tải danh sách cuộc thi.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadContests();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!contestId) return;
    const controller = new AbortController();
    async function loadAnalytics() {
      setAnalytics(null);
      setError("");
      setNotice("");
      try {
        const { data } = await http.get<Envelope<Analytics>>(
          `/api/v1/contests/${contestId}/analytics`,
          { signal: controller.signal },
        );
        setAnalytics(data.data);
      } catch {
        if (!controller.signal.aborted) setError("Không thể tải thống kê cuộc thi.");
      }
    }
    void loadAnalytics();
    return () => controller.abort();
  }, [contestId]);

  async function generateReport() {
    setGenerating(true);
    setNotice("");
    try {
      const { data } = await http.post<Envelope<Analytics>>(`/api/v1/contests/${contestId}/analytics`);
      setAnalytics(data.data);
      if (!data.data.report) setNotice("Chưa tạo được nhận xét AI. Bạn vẫn có thể xem và xuất thống kê.");
    } catch {
      setNotice("Chưa tạo được nhận xét AI. Bạn vẫn có thể xem và xuất thống kê.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Thống kê cuộc thi</h1>
        <label className="mt-4 block text-sm font-medium" htmlFor="analytics-contest">Cuộc thi</label>
        <select
          className="mt-1 max-w-full rounded-md border bg-background p-2 text-sm"
          id="analytics-contest"
          value={contestId}
          disabled={loading || generating || contests.length === 0}
          onChange={(event) => setContestId(event.target.value)}
        >
          {!contests.length && <option value="">{loading ? "Đang tải…" : "Chưa có cuộc thi"}</option>}
          {contests.map((contest) => <option key={contest.id} value={contest.id}>{contest.name}</option>)}
        </select>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!analytics && contestId && !error && <p role="status">Đang tải thống kê…</p>}
      {analytics && (
        <>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void generateReport()} disabled={generating}>
              {generating ? "Đang phân tích…" : "Tạo nhận xét AI"}
            </Button>
            <Button asChild variant="outline">
              <a
                download={`contest-${contestId}-analytics.json`}
                href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(analytics, null, 2))}`}
              >
                Xuất JSON
              </a>
            </Button>
          </div>
          <Card>
            <CardHeader><CardTitle>{analytics.contest.name}</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>{analytics.totals.submissions} bài dự thi · {analytics.totals.aiWarnings} cảnh báo AI</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2">Hạng mục</th>
                      <th className="p-2">Số bài</th>
                      <th className="p-2">Cảnh báo AI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.categories.map((category) => (
                      <tr key={category.name} className="border-b">
                        <td className="p-2">{category.name}</td>
                        <td className="p-2">{category.submissions}</td>
                        <td className="p-2">{category.aiWarnings}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          {notice && <p role="status" className="text-sm">{notice}</p>}
          {analytics.report && (
            <Card>
              <CardHeader><CardTitle>Nhận xét AI</CardTitle></CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm">{analytics.report}</CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
