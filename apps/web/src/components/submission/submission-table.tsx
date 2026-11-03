"use client";

import { AlertTriangle, Check, Eye, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import ImageComparisonModal from "@/components/submission/image-comparison-modal";
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
import { http } from "@/lib/http/client";
import { filterSubmissions } from "@/lib/submission-utils";
import type { Submission, SubmissionStatus } from "@/types/submission";

export default function SubmissionTable() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(
    null,
  );

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        setIsLoading(true);
        const res = await http.get("/api/v1/submissions", {
          params: { limit: 100 },
        });
        if (res.data?.data) {
          setSubmissions(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch submissions:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSubmissions();
  }, []);

  const visibleSubmissions = filterSubmissions(submissions, query);

  const updateStatus = (id: string, status: SubmissionStatus) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s)),
    );
  };

  const openComparison = (id: string) => {
    setSelectedSubmission(id);
    setIsModalOpen(true);
  };

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
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : visibleSubmissions.length === 0 ? (
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
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-500 text-white">
                          <AlertTriangle className="size-3.5" />
                          Cảnh báo AI
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openComparison(submission.id)}
                        >
                          <Eye className="size-4" />
                          So sánh
                        </Button>
                      </div>
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

      <ImageComparisonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        submissionId={selectedSubmission}
      />
    </div>
  );
}
