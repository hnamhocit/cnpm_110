"use client";

import {
  AlertCircle,
  Aperture,
  Camera as CameraIcon,
  Film,
  FlaskConical,
  Lock,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CameraForm } from "@/components/master-data/camera-form";
import { FilmLabForm } from "@/components/master-data/film-lab-form";
import { FilmStockForm } from "@/components/master-data/film-stock-form";
import { LensForm } from "@/components/master-data/lens-form";
import { MasterDataTable } from "@/components/master-data/master-data-table";
import { SoftDeleteDialog } from "@/components/master-data/soft-delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  createMasterData,
  fetchCurrentUserRole,
  listMasterData,
  type MasterDataErrorInfo,
  softDeleteMasterData,
  toMasterDataError,
  updateMasterData,
} from "@/lib/master-data-api";
import {
  type Camera,
  type CameraInput,
  ENTITY_LABELS,
  FILM_PROCESSES,
  type FilmLab,
  type FilmLabInput,
  type FilmProcess,
  type FilmStock,
  type FilmStockInput,
  type Lens,
  type LensInput,
  type MasterDataEntity,
  type MasterDataInput,
  type MasterDataRecord,
  type MasterDataStatus,
  PROCESS_LABELS,
} from "@/types/master-data";

type StatusFilter = "ACTIVE" | "DEPRECATED" | "ALL";

const TABS: { value: MasterDataEntity; label: string; icon: typeof Film }[] = [
  { value: "film-stocks", label: "Film Stocks", icon: Film },
  { value: "cameras", label: "Máy ảnh", icon: CameraIcon },
  { value: "lenses", label: "Ống kính", icon: Aperture },
  { value: "film-labs", label: "Phòng Lab", icon: FlaskConical },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "ACTIVE", label: "Đang dùng" },
  { value: "DEPRECATED", label: "Ngừng lưu hành" },
];

const SKELETON_ROWS = ["r1", "r2", "r3", "r4", "r5"] as const;

function errorText(error: MasterDataErrorInfo | null): string {
  return error?.message ?? "";
}

export default function MasterDataPage() {
  const [entity, setEntity] = useState<MasterDataEntity>("film-stocks");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [processFilter, setProcessFilter] = useState<FilmProcess | "">("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);

  const [items, setItems] = useState<MasterDataRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<MasterDataErrorInfo | null>(null);

  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MasterDataRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<MasterDataRecord | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const canMutate = role === "Admin";

  useEffect(() => {
    let active = true;
    fetchCurrentUserRole().then((value) => {
      if (active) {
        setRole(value);
        setRoleLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: revision kích hoạt refetch sau mỗi thao tác ghi.
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const result = await listMasterData<MasterDataRecord>(entity, {
          search: appliedSearch,
          status,
          process: processFilter || undefined,
          page,
          limit: 20,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setItems(result.items);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } catch (error) {
        if (controller.signal.aborted) return;
        setItems([]);
        setTotal(0);
        setTotalPages(1);
        setLoadError(toMasterDataError(error));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [entity, appliedSearch, status, processFilter, page, revision]);

  function resetFilters() {
    setSearchInput("");
    setAppliedSearch("");
    setStatus("ALL");
    setProcessFilter("");
    setPage(1);
  }

  function changeEntity(next: MasterDataEntity) {
    if (next === entity) return;
    setEntity(next);
    setDialogOpen(false);
    setEditing(null);
    setFormError("");
    resetFilters();
  }

  function openCreate() {
    setEditing(null);
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(record: MasterDataRecord) {
    setEditing(record);
    setFormError("");
    setDialogOpen(true);
  }

  function closeDialog() {
    if (saving) return;
    setDialogOpen(false);
    setEditing(null);
    setFormError("");
  }

  async function handleSubmit(input: MasterDataInput) {
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        await updateMasterData(entity, editing.id, {
          ...input,
          version: editing.version,
        });
        toast.success("Đã cập nhật danh mục thành công.");
      } else {
        await createMasterData(entity, input);
        toast.success(`Đã thêm ${ENTITY_LABELS[entity].singular} thành công.`);
      }
      setDialogOpen(false);
      setEditing(null);
      setRevision((value) => value + 1);
    } catch (error) {
      const info = toMasterDataError(error);
      setFormError(info.message);
      if (info.status === 403) toast.error(info.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await softDeleteMasterData(entity, deleteTarget.id);
      toast.success(
        "Đã xóa mềm bản ghi. Dữ liệu lịch sử liên kết vẫn được bảo toàn (BR-03).",
      );
      setDeleteTarget(null);
      setRevision((value) => value + 1);
    } catch (error) {
      toast.error(toMasterDataError(error).message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleStatus(record: MasterDataRecord) {
    const nextStatus: MasterDataStatus =
      record.status === "ACTIVE" ? "DEPRECATED" : "ACTIVE";
    setBusyId(record.id);
    try {
      await updateMasterData(entity, record.id, {
        status: nextStatus,
        version: record.version,
      });
      toast.success(
        nextStatus === "ACTIVE"
          ? "Đã kích hoạt bản ghi cho các bài thi mới."
          : "Đã chuyển bản ghi sang Ngừng lưu hành. Bài thi cũ vẫn giữ nguyên.",
      );
      setRevision((value) => value + 1);
    } catch (error) {
      toast.error(toMasterDataError(error).message);
    } finally {
      setBusyId(null);
    }
  }

  const isEmpty = !loading && !loadError && items.length === 0;
  const hasFilters =
    Boolean(appliedSearch) || status !== "ALL" || Boolean(processFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Master Data</h1>
          <p className="text-sm text-muted-foreground">
            Quản trị danh mục Film Stock, máy ảnh, ống kính và phòng Lab dùng
            chung cho logbook và nộp bài (UC-06–08, BR-02/03/22).
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!roleLoading && !canMutate && (
            <Badge variant="outline" className="gap-1">
              <Lock className="size-3" />
              Chế độ chỉ đọc
            </Badge>
          )}
          {canMutate && (
            <Button type="button" className="gap-1.5" onClick={openCreate}>
              <Plus className="size-4" />
              Thêm {ENTITY_LABELS[entity].singular}
            </Button>
          )}
        </div>
      </div>

      {!roleLoading && !canMutate && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300"
        >
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            Bạn không có quyền thực hiện thao tác này. (MSG005) Chỉ
            Administrator được tạo, sửa hoặc xóa mềm Master Data (BR-02).
            {role === null && (
              <>
                {" "}
                <Link href="/login" className="underline underline-offset-2">
                  Đăng nhập lại
                </Link>
              </>
            )}
          </span>
        </div>
      )}

      <Card>
        <CardHeader className="gap-3 border-b pb-3">
          <div
            role="tablist"
            aria-label="Loại danh mục"
            className="flex flex-wrap gap-1.5"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = tab.value === entity;
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => changeEntity(tab.value)}
                  className={
                    active
                      ? "flex items-center gap-1.5 rounded-full bg-brand-solid px-3 py-1.5 text-xs font-semibold text-white"
                      : "flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/60"
                  }
                >
                  <Icon className="size-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setPage(1);
                setAppliedSearch(searchInput.trim());
              }}
            >
              <div className="relative min-w-0">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  maxLength={150}
                  placeholder="Tìm theo tên, hãng hoặc mã…"
                  aria-label="Tìm kiếm danh mục"
                  className="w-64 pl-8"
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </div>
              <select
                value={status}
                aria-label="Lọc theo trạng thái"
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                onChange={(event) => {
                  setPage(1);
                  setStatus(event.target.value as StatusFilter);
                }}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="outline" className="gap-1.5">
                <Search className="size-3.5" />
                Tìm
              </Button>
              {hasFilters && (
                <Button type="button" variant="ghost" onClick={resetFilters}>
                  Xóa bộ lọc
                </Button>
              )}
            </form>

            <p className="text-xs text-muted-foreground">
              {loading ? "Đang tải…" : `${total} bản ghi`}
            </p>
          </div>

          {entity === "film-stocks" && (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setPage(1);
                  setProcessFilter("");
                }}
                className={
                  processFilter === ""
                    ? "rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold"
                    : "rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted/60"
                }
              >
                Tất cả quy trình
              </button>
              {FILM_PROCESSES.map((process) => (
                <button
                  key={process}
                  type="button"
                  onClick={() => {
                    setPage(1);
                    setProcessFilter(process);
                  }}
                  className={
                    processFilter === process
                      ? "rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold"
                      : "rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted/60"
                  }
                >
                  {PROCESS_LABELS[process]}
                </button>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4" aria-live="polite" aria-busy="true">
              <span className="sr-only">Đang tải dữ liệu</span>
              {SKELETON_ROWS.map((row) => (
                <div
                  key={row}
                  className="h-10 animate-pulse rounded-lg bg-slate-200/70 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : loadError ? (
            <div
              role="alert"
              className="m-4 flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <div className="space-y-1">
                  <p>{errorText(loadError)}</p>
                  {loadError.contractGap && (
                    <p className="text-xs">
                      Hợp đồng `/api/v1/master-data/*` đang ở trạng thái planned
                      (Module 02). Cần FPC-080 mount route trước khi nghiệm thu.
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setRevision((value) => value + 1)}
                >
                  <RefreshCw className="size-3.5" />
                  Thử lại
                </Button>
              </div>
            </div>
          ) : isEmpty ? (
            <div className="p-4">
              <EmptyState
                icon={<Film className="size-8" />}
                title="Không tìm thấy kết quả phù hợp."
                description="Không tìm thấy kết quả phù hợp. / No matching records found. (MSG001)"
                action={
                  hasFilters
                    ? { label: "Xóa bộ lọc", onClick: resetFilters }
                    : canMutate
                      ? {
                          label: `Thêm ${ENTITY_LABELS[entity].singular}`,
                          onClick: openCreate,
                        }
                      : undefined
                }
              />
            </div>
          ) : (
            <MasterDataTable
              entity={entity}
              items={items}
              canMutate={canMutate}
              busyId={busyId}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onToggleStatus={handleToggleStatus}
            />
          )}
        </CardContent>

        {!loading && !loadError && items.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-xs text-muted-foreground">
              Trang {page} / {Math.max(1, totalPages)} · {total} bản ghi
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Trang trước
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Trang sau
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        {dialogOpen && entity === "film-stocks" && (
          <FilmStockForm
            key={editing?.id ?? "new"}
            initial={editing as FilmStock | null}
            submitting={saving}
            serverError={formError}
            onCancel={closeDialog}
            onSubmit={(input: FilmStockInput) => handleSubmit(input)}
          />
        )}
        {dialogOpen && entity === "cameras" && (
          <CameraForm
            key={editing?.id ?? "new"}
            initial={editing as Camera | null}
            submitting={saving}
            serverError={formError}
            onCancel={closeDialog}
            onSubmit={(input: CameraInput) => handleSubmit(input)}
          />
        )}
        {dialogOpen && entity === "lenses" && (
          <LensForm
            key={editing?.id ?? "new"}
            initial={editing as Lens | null}
            submitting={saving}
            serverError={formError}
            onCancel={closeDialog}
            onSubmit={(input: LensInput) => handleSubmit(input)}
          />
        )}
        {dialogOpen && entity === "film-labs" && (
          <FilmLabForm
            key={editing?.id ?? "new"}
            initial={editing as FilmLab | null}
            submitting={saving}
            serverError={formError}
            onCancel={closeDialog}
            onSubmit={(input: FilmLabInput) => handleSubmit(input)}
          />
        )}
      </Dialog>

      <SoftDeleteDialog
        entity={entity}
        target={deleteTarget}
        busy={deleting}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
