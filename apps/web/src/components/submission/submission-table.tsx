"use client";

import { AlertTriangle, Check, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatContestDate } from "@/lib/contest-utils";
import { http } from "@/lib/http";
import { filterSubmissions } from "@/lib/submission-utils";
import type { Submission, SubmissionApiResponse, SubmissionStatus } from "@/types/submission";

export default function SubmissionTable() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await http.get<{
          success: boolean;
          code: number;
          message: string;
          data: SubmissionApiResponse[];
        }>("api/v1/submissions?limit=100");

        const mappedSubmissions: Submission[] = response.data.data.map((apiSub) => ({
          id: apiSub.id,
          participantId: apiSub.participantId,
          authorName: `Participant ${apiSub.participantId.slice(0, 8)}`,
          title: apiSub.title,
          submittedAt: apiSub.createdAt,
          isAiFlagged: apiSub.aiFlagged,
          status: apiSub.status,
        }));

        setSubmissions(mappedSubmissions);
      } catch (err) {
        setError("Không thể tải danh sách bài dự thi");
        console.error("Failed to fetch submissions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const visibleSubmissions = filterSubmissions(submissions, query);

  const updateStatus = async (id: string, status: SubmissionStatus) => {
    try {
      const endpoint = status === "APPROVED" 
        ? `/api/v1/submissions/${id}/approve`
        : `/api/v1/submissions/${id}/reject`;
      
      let body = {};
      if (status === "DISQUALIFIED") {
        const reason = prompt("Nhập lý do từ chối (tối thiểu 10 ký tự):");
        if (!reason) {
          alert("Bạn phải nhập lý do để từ chối bài dự thi");
          return;
        }
        if (reason.length < 10) {
          alert("Lý do phải có ít nhất 10 ký tự");
          return;
        }
        body = { reason };
      }
      
      await http.post(endpoint, body);
      
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s)),
      );
    } catch (err) {
      console.error(`Failed to update submission ${id}:`, err);
      alert("Không thể cập nhật trạng thái bài dự thi");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Đang tải...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm theo tên thí sinh..."
          className="pl-8"
          aria-label="Tìm theo tên thí sinh"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã bài thi</TableHead>
              <TableHead>Tên thí sinh / Nhóm</TableHead>
              <TableHead>Tên bài dự thi</TableHead>
              <TableHead>Ngày nộp</TableHead>
              <TableHead>Cảnh báo AI</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleSubmissions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  Không tìm thấy bài dự thi nào.
                </TableCell>
              </TableRow>
            ) : (
              visibleSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-mono text-xs">
                    {submission.id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {submission.authorName}
                  </TableCell>
                  <TableCell>{submission.title}</TableCell>
                  <TableCell>
                    {formatContestDate(submission.submittedAt)}
                  </TableCell>
                  <TableCell>
                    {submission.isAiFlagged ? (
                      <Badge className="bg-red-500 text-white">
                        <AlertTriangle className="size-3.5" />
                        Cảnh báo AI
                      </Badge>
                    ) : (
                      <Badge className="bg-green-600 text-white">
                        <Check className="size-3.5" />
                        Hợp lệ
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {submission.status === "APPROVED" ? (
                      <Badge className="bg-green-600 text-white">
                        Đã duyệt
                      </Badge>
                    ) : submission.status === "DISQUALIFIED" ? (
                      <Badge className="bg-red-500 text-white">
                        Đã từ chối
                      </Badge>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            updateStatus(submission.id, "APPROVED")
                          }
                        >
                          <Check />
                          Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            updateStatus(submission.id, "DISQUALIFIED")
                          }
                        >
                          <X />
                          Từ chối
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
