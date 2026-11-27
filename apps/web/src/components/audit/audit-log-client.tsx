"use client";

import { AlertCircle, Loader2, ScrollText } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAuditLogErrorMessage, getAuditLogs } from "@/lib/audit-log-api";
import {
  formatAuditAction,
  formatAuditDate,
  formatAuditResourceType,
  formatAuditValue,
  normalizeAuditQuery,
  validateAuditDateRange,
} from "@/lib/audit-log-utils";
import { fetchCurrentUserRole } from "@/lib/master-data-api";
import type { AuditLogEntry, AuditLogPage } from "@/types/audit-log";

const ACCESS_DENIED =
  "Bạn không có quyền thực hiện thao tác này. / Access denied. (MSG005)";
const DEFAULT_LIMIT = 20;
const LIMIT_OPTIONS = [10, 20, 50, 100] as const;
const SKELETON_ROWS = ["r1", "r2", "r3", "r4", "r5"] as const;

type FilterState = {
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  search: string;
  from: string;
  to: string;
};

const EMPTY_FILTERS: FilterState = {
  actorId: "",
  action: "",
  resourceType: "",
  resourceId: "",
  search: "",
  from: "",
  to: "",
};

export default function AuditLogClient() {
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [data, setData] = useState<AuditLogPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    let active = true;
    fetchCurrentUserRole().then((value) => {
      if (!active) return;
      setRole(value);
      setRoleLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (role !== "Admin") return;

    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getAuditLogs(
          normalizeAuditQuery({ ...appliedFilters, page, limit }),
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setData(result);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setData(null);
        setError(getAuditLogErrorMessage(loadError));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [role, appliedFilters, page, limit]);

  function updateFilter(key: keyof FilterState, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = validateAuditDateRange(filters.from, filters.to);
    setDateError(message);
    if (message) return;
    setAppliedFilters({ ...filters });
    setPage(1);
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters({ ...EMPTY_FILTERS });
    setDateError(null);
    setPage(1);
    setLimit(DEFAULT_LIMIT);
  }

  if (roleLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Đang kiểm tra quyền truy cập…
        </CardContent>
      </Card>
    );
  }

  if (role !== "Admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>MSG005 · Access denied</CardTitle>
        </CardHeader>
        <CardContent className="flex items-start gap-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            {ACCESS_DENIED} Chỉ Admin được tra cứu nhật ký kiểm toán
            (audit_logs:read).
          </span>
        </CardContent>
      </Card>
    );
  }

  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const detailRows = selected
    ? [
        { label: "Actor ID", value: formatAuditValue(selected.actorId) },
        {
          label: "Tên người thực hiện",
          value: formatAuditValue(selected.actorName),
        },
        { label: "Email", value: formatAuditValue(selected.actorEmail) },
        { label: "IP", value: formatAuditValue(selected.ipAddress) },
        { label: "Hành động", value: selected.action },
        { label: "Loại đối tượng", value: selected.resourceType },
        { label: "ID đối tượng", value: formatAuditValue(selected.resourceId) },
        { label: "Thời gian", value: formatAuditDate(selected.createdAt) },
        { label: "Lý do", value: formatAuditValue(selected.reason) },
      ]
    : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Bộ lọc tra cứu</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={applyFilters}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div className="space-y-1">
              <Label htmlFor="audit-actor-id">Actor ID</Label>
              <Input
                id="audit-actor-id"
                value={filters.actorId}
                placeholder="ID người thực hiện"
                onChange={(event) =>
                  updateFilter("actorId", event.target.value)
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="audit-search">Tìm kiếm</Label>
              <Input
                id="audit-search"
                value={filters.search}
                placeholder="Từ khóa trong nhật ký"
                onChange={(event) => updateFilter("search", event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="audit-resource-id">Resource ID</Label>
              <Input
                id="audit-resource-id"
                value={filters.resourceId}
                placeholder="ID đối tượng"
                onChange={(event) =>
                  updateFilter("resourceId", event.target.value)
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="audit-action">Hành động</Label>
              <Input
                id="audit-action"
                value={filters.action}
                placeholder="Ví dụ: APPROVE"
                onChange={(event) => updateFilter("action", event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="audit-resource-type">Loại đối tượng</Label>
              <Input
                id="audit-resource-type"
                value={filters.resourceType}
                placeholder="Ví dụ: SUBMISSION"
                onChange={(event) =>
                  updateFilter("resourceType", event.target.value)
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="audit-from">Từ ngày</Label>
              <Input
                id="audit-from"
                type="date"
                value={filters.from}
                onChange={(event) => updateFilter("from", event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="audit-to">Đến ngày</Label>
              <Input
                id="audit-to"
                type="date"
                value={filters.to}
                onChange={(event) => updateFilter("to", event.target.value)}
              />
            </div>
            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
              <Button type="submit" disabled={loading}>
                Áp dụng
              </Button>
              <Button type="button" variant="ghost" onClick={resetFilters}>
                Đặt lại
              </Button>
            </div>
          </form>
          {dateError && (
            <p
              role="alert"
              className="mt-3 flex items-center gap-2 text-sm text-destructive"
            >
              <AlertCircle className="size-4" />
              {dateError}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="size-4" />
            Kết quả nhật ký
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4" aria-live="polite" aria-busy="true">
              <span className="sr-only">Đang tải nhật ký kiểm toán</span>
              {SKELETON_ROWS.map((row) => (
                <div
                  key={row}
                  className="h-10 animate-pulse rounded-lg bg-slate-200/70 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : error ? (
            <div
              role="alert"
              className="m-4 flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold">Chưa thể tải nhật ký</p>
                  <p>{error}</p>
                </div>
              </div>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setAppliedFilters((current) => ({ ...current }))
                  }
                >
                  Thử lại
                </Button>
              </div>
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={<ScrollText className="size-8" />}
                title="Không tìm thấy kết quả phù hợp."
                description="Không tìm thấy kết quả phù hợp. / No matching records found. (MSG001)"
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Người thực hiện</TableHead>
                  <TableHead>Hành động</TableHead>
                  <TableHead>Đối tượng</TableHead>
                  <TableHead>Lý do</TableHead>
                  <TableHead>Chi tiết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatAuditDate(entry.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span>
                          {formatAuditValue(
                            entry.actorName ||
                              entry.actorEmail ||
                              entry.actorId,
                          )}
                        </span>
                        {entry.actorId && (
                          <span className="text-xs text-muted-foreground">
                            {entry.actorId}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="brand">
                        {formatAuditAction(entry.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <Badge variant="outline">
                          {formatAuditResourceType(entry.resourceType)}
                        </Badge>
                        {entry.resourceId && (
                          <span className="text-xs text-muted-foreground">
                            {entry.resourceId}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs whitespace-normal">
                      {formatAuditValue(entry.reason)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelected(entry)}
                      >
                        Xem
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {data && data.items.length > 0 && !error && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Trang {data.page} / {totalPages} · {data.total} bản ghi
            </p>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="audit-limit"
                className="text-xs text-muted-foreground"
              >
                Hiển thị
              </Label>
              <select
                id="audit-limit"
                value={limit}
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                onChange={(event) => {
                  setLimit(Number(event.target.value));
                  setPage(1);
                }}
              >
                {LIMIT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading || page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Trước
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading || page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Tiếp
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        {selected && (
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chi tiết nhật ký kiểm toán</DialogTitle>
              <DialogDescription>
                {formatAuditAction(selected.action)} ·{" "}
                {formatAuditDate(selected.createdAt)}
              </DialogDescription>
            </DialogHeader>
            <dl className="grid gap-3 sm:grid-cols-2">
              {detailRows.map((row) => (
                <div key={row.label} className="space-y-1">
                  <dt className="text-xs text-muted-foreground">{row.label}</dt>
                  <dd className="break-words text-sm">{row.value}</dd>
                </div>
              ))}
            </dl>
            <div className="space-y-2">
              <p className="text-xs font-semibold">Giá trị cũ</p>
              <pre className="max-h-48 overflow-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">
                {formatAuditValue(selected.oldValue)}
              </pre>
              <p className="text-xs font-semibold">Giá trị mới</p>
              <pre className="max-h-48 overflow-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">
                {formatAuditValue(selected.newValue)}
              </pre>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
