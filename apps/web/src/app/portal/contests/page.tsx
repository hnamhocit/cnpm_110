"use client";

import { ChevronDown, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { loadCurrentUser } from "@/lib/stores/user-store";
import {
  CONTEST_STATUS_LABELS,
  type ContestConfigRecord,
  normalizeContestStatus,
} from "@/types/contest-config";

type Contest = ContestConfigRecord;
function statusLabel(status: string) {
  if (status.toLowerCase() === "ongoing") return "Đang diễn ra";
  if (status.toLowerCase() === "cancelled") return "Đã hủy";
  return CONTEST_STATUS_LABELS[normalizeContestStatus(status)];
}
function date(value?: string | null) {
  const result = formatContestDate(value);
  return result === "N/A" ? "Chưa thiết lập" : result;
}

export default function OrganizerContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchContests = async () => {
      try {
        setLoading(true);
        if (!active) return;
        setError(null);
        // RBAC: Organizer chỉ thấy cuộc thi do mình quản lý, Admin xem tất cả
        let url = "/api/v1/contests";
        const user = await loadCurrentUser();
        if (user?.role === "Organizer") {
          url = `/api/v1/contests?createdBy=${user.id}`;
        }

        const res = await http.get(url, { params: { page, limit: 10 } });
        const raw = res.data?.data ?? res.data;
        const items = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.items)
            ? raw.items
            : Array.isArray(res.data?.items)
              ? res.data.items
              : [];
        if (!active) return;
        setContests(items);
        setTotal(raw?.pagination?.total ?? items.length);
        setTotalPages(raw?.pagination?.totalPages ?? 1);
      } catch (err: unknown) {
        const apiErr = err as { response?: { data?: { message?: string } } };
        if (!active) return;
        setError(
          apiErr.response?.data?.message || "Không thể tải danh sách cuộc thi",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchContests();
    return () => {
      active = false;
    };
  }, [page]);

  const filtered = contests.filter((contest) => {
    const query = search.trim().toLocaleLowerCase("vi");
    return (
      (!query ||
        `${contest.name} ${contest.code ?? ""} ${contest.theme ?? ""}`
          .toLocaleLowerCase("vi")
          .includes(query)) &&
      (statusFilter === "all" ||
        normalizeContestStatus(contest.status) === statusFilter)
    );
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Quản lý cuộc thi
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi lịch trình và quản lý các cuộc thi nhiếp ảnh phim.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/portal/contests/create">
            <Plus />
            Tạo cuộc thi mới
          </Link>
        </Button>
      </div>
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold">
              Danh sách cuộc thi{" "}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                ({total})
              </span>
            </p>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  aria-label="Tìm trong trang hiện tại"
                  placeholder="Tìm tên, mã, chủ đề trong trang…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    aria-label="Lọc trạng thái trong trang hiện tại"
                  >
                    {Object.entries(CONTEST_STATUS_LABELS).find(
                      ([value]) => value === statusFilter,
                    )?.[1] ?? "Tất cả trạng thái"}
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <DropdownMenuRadioItem value="all">
                      Tất cả trạng thái
                    </DropdownMenuRadioItem>
                    {Object.entries(CONTEST_STATUS_LABELS).map(
                      ([value, label]) => (
                        <DropdownMenuRadioItem key={value} value={value}>
                          {label}
                        </DropdownMenuRadioItem>
                      ),
                    )}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {loading ? (
            <output className="py-12 text-center text-muted-foreground">
              Đang tải dữ liệu…
            </output>
          ) : error ? (
            <p role="alert" className="py-12 text-center text-destructive">
              {error}
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              {contests.length
                ? "Không có cuộc thi phù hợp với bộ lọc trong trang này."
                : "Bạn chưa có cuộc thi nào. Hãy tạo cuộc thi đầu tiên."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuộc thi</TableHead>
                  <TableHead>Đăng ký & nộp bài</TableHead>
                  <TableHead>Chấm thi & công bố</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((contest) => {
                  const status = normalizeContestStatus(contest.status);
                  return (
                    <TableRow key={contest.id}>
                      <TableCell className="min-w-64 max-w-80 whitespace-normal align-top">
                        {contest.code && (
                          <p className="mb-1 text-xs text-muted-foreground">
                            {contest.code}
                          </p>
                        )}
                        <Link
                          href={`/portal/contests/${contest.id}`}
                          className="font-semibold leading-6 hover:text-primary hover:underline"
                        >
                          {contest.name || "Cuộc thi chưa có tên"}
                        </Link>
                        {contest.theme && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {contest.theme}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="align-top text-xs leading-6">
                        <dl>
                          <div>
                            <dt className="inline text-muted-foreground">
                              Mở đăng ký:{" "}
                            </dt>
                            <dd className="inline">
                              {date(
                                contest.registrationStartAt ??
                                  contest.registration_start_at ??
                                  contest.startAt ??
                                  contest.start_at,
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="inline text-muted-foreground">
                              Hạn nộp:{" "}
                            </dt>
                            <dd className="inline">
                              {date(
                                contest.submissionDeadlineAt ??
                                  contest.submission_deadline_at ??
                                  contest.endAt ??
                                  contest.end_at,
                              )}
                            </dd>
                          </div>
                        </dl>
                      </TableCell>
                      <TableCell className="align-top text-xs leading-6">
                        <dl>
                          <div>
                            <dt className="inline text-muted-foreground">
                              Bắt đầu:{" "}
                            </dt>
                            <dd className="inline">
                              {date(
                                contest.judgingStartAt ??
                                  contest.judging_start_at,
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="inline text-muted-foreground">
                              Kết thúc:{" "}
                            </dt>
                            <dd className="inline">
                              {date(
                                contest.judgingDeadlineAt ??
                                  contest.judging_deadline_at,
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="inline text-muted-foreground">
                              Công bố:{" "}
                            </dt>
                            <dd className="inline">
                              {date(
                                contest.publishedAt ?? contest.published_at,
                              )}
                            </dd>
                          </div>
                        </dl>
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge
                          variant={
                            status === "OPEN"
                              ? "valid"
                              : status === "IN_JUDGING"
                                ? "brand"
                                : "secondary"
                          }
                        >
                          {statusLabel(contest.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/portal/contests/${contest.id}`}>
                              Chi tiết
                            </Link>
                          </Button>
                          <Button asChild size="sm">
                            <Link
                              href={`/portal/contests/${contest.id}/submissions`}
                            >
                              Bài dự thi
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          <div className="flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
            <span>
              Trang {page} / {Math.max(1, totalPages)}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={loading || page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                disabled={loading || page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
