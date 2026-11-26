"use client";

import { ArrowLeft, LoaderCircle, Pencil, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchContestCategories,
  saveCategory,
  toContestConfigError,
} from "@/lib/contest-config-api";
import {
  type CategoryConfig,
  type CategoryRecord,
  FORMAT_RESTRICTION_LABELS,
  type FormatRestriction,
  isFormatRestriction,
} from "@/types/contest-config";

type CategoryForm = CategoryConfig & { isActive: boolean };

function emptyForm(): CategoryForm {
  return {
    code: "",
    name: "",
    formatRestriction: "ALL",
    maxEntriesPerParticipant: 3,
    requireNegativeProofUpfront: false,
    isActive: true,
  };
}

function isCategoryActive(record: CategoryRecord): boolean {
  if (record.isActive !== undefined && record.isActive !== null)
    return record.isActive;
  if (record.is_active !== undefined && record.is_active !== null)
    return record.is_active;
  return (record.status ?? "active").toLowerCase() !== "inactive";
}

function formFromRecord(record: CategoryRecord): CategoryForm {
  const format = record.formatRestriction ?? record.format_restriction ?? "ALL";
  return {
    id: record.id,
    code: record.code ?? "",
    name: record.name,
    formatRestriction: isFormatRestriction(format) ? format : "ALL",
    maxEntriesPerParticipant:
      record.maxEntriesPerParticipant ??
      record.max_entries_per_participant ??
      3,
    requireNegativeProofUpfront:
      record.requireNegativeProofUpfront ??
      record.require_negative_proof_upfront ??
      false,
    isActive: isCategoryActive(record),
  };
}

export default function ContestCategoriesPage() {
  const params = useParams<{ id: string }>();
  const contestId = params.id;
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gapBanner, setGapBanner] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!contestId) {
      setError("Thiếu mã cuộc thi.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setCategories(await fetchContestCategories(contestId));
    } catch (loadError) {
      const mapped = toContestConfigError(loadError);
      setError(mapped.message);
      if (mapped.contractGap) setGapBanner(mapped.contractGap);
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async () => {
    if (!contestId) return;
    setError(null);
    if (!form.name.trim() || form.name.trim().length < 3) {
      setError("Tên hạng mục phải có ít nhất 3 ký tự.");
      return;
    }
    if (
      form.maxEntriesPerParticipant < 1 ||
      form.maxEntriesPerParticipant > 10
    ) {
      setError("Số bài tối đa mỗi thí sinh phải từ 1 đến 10.");
      return;
    }

    setSaving(true);
    try {
      await saveCategory(contestId, form, editingId);
      toast.success(editingId ? "Đã cập nhật hạng mục." : "Đã thêm hạng mục.");
      setForm(emptyForm());
      setEditingId(undefined);
      await load();
    } catch (saveError) {
      const mapped = toContestConfigError(saveError);
      setError(mapped.message);
      if (mapped.contractGap) setGapBanner(mapped.contractGap);
      toast.error(mapped.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (record: CategoryRecord) => {
    if (!contestId) return;
    setError(null);
    const nextActive = !isCategoryActive(record);
    try {
      await saveCategory(
        contestId,
        { ...formFromRecord(record), isActive: nextActive },
        record.id,
      );
      toast.success(
        nextActive ? "Đã kích hoạt hạng mục." : "Đã vô hiệu hóa hạng mục.",
      );
      await load();
    } catch (toggleError) {
      const mapped = toContestConfigError(toggleError);
      setError(mapped.message);
      if (mapped.contractGap) setGapBanner(mapped.contractGap);
      toast.error(mapped.message);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href={`/portal/contests/${contestId}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 size-4" /> Quay lại chi tiết cuộc thi
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Quản lý hạng mục
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            UC-13: thêm, sửa, kích hoạt hoặc vô hiệu hóa hạng mục (BR-03,
            BR-06).
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw /> Tải lại
        </Button>
      </div>

      {gapBanner && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          API quản lý hạng mục chưa mount (FPC-083). Biểu mẫu vẫn giữ lại để
          thao tác khi backend sẵn sàng.
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {editingId ? "Chỉnh sửa hạng mục" : "Thêm hạng mục mới"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="category-code">Mã hạng mục</Label>
              <Input
                id="category-code"
                value={form.code}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    code: event.target.value,
                  }))
                }
                placeholder="CAT-STREET-35"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category-name">Tên hạng mục *</Label>
              <Input
                id="category-name"
                value={form.name}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                placeholder="VD: Nhiếp ảnh Đường phố 35mm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category-format">Khổ phim</Label>
              <select
                id="category-format"
                value={form.formatRestriction}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    formatRestriction: event.target.value as FormatRestriction,
                  }))
                }
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                {(
                  Object.keys(FORMAT_RESTRICTION_LABELS) as FormatRestriction[]
                ).map((format) => (
                  <option key={format} value={format}>
                    {FORMAT_RESTRICTION_LABELS[format]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category-max">Số bài tối đa / thí sinh</Label>
              <Input
                id="category-max"
                type="number"
                min={1}
                max={10}
                value={form.maxEntriesPerParticipant}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    maxEntriesPerParticipant: Number(event.target.value),
                  }))
                }
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="category-proof"
              checked={form.requireNegativeProofUpfront}
              onCheckedChange={(checked) =>
                setForm((previous) => ({
                  ...previous,
                  requireNegativeProofUpfront: checked === true,
                }))
              }
            />
            <Label htmlFor="category-proof">
              Bắt buộc nộp âm bản ngay từ lúc nộp bài (BR-06)
            </Label>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setForm(emptyForm());
                  setEditingId(undefined);
                }}
              >
                Hủy chỉnh sửa
              </Button>
            )}
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={saving}
            >
              {saving ? (
                <LoaderCircle className="animate-spin" />
              ) : editingId ? (
                <Pencil />
              ) : (
                <Plus />
              )}
              {editingId ? "Lưu thay đổi" : "Thêm hạng mục"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Danh sách hạng mục</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" /> Đang tải danh
              sách hạng mục...
            </p>
          ) : categories.length === 0 ? (
            <EmptyState
              title="Không tìm thấy kết quả phù hợp."
              description="Cuộc thi này chưa có hạng mục hoặc backend chưa trả dữ liệu."
            />
          ) : (
            categories.map((category) => {
              const active = isCategoryActive(category);
              const format =
                category.formatRestriction ??
                category.format_restriction ??
                "ALL";
              return (
                <div
                  key={category.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{category.name}</p>
                      <Badge variant={active ? "valid" : "secondary"}>
                        {active ? "Đang hoạt động" : "Đã vô hiệu hóa"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {category.code || "—"} ·{" "}
                      {isFormatRestriction(format)
                        ? FORMAT_RESTRICTION_LABELS[format]
                        : format}{" "}
                      · tối đa{" "}
                      {category.maxEntriesPerParticipant ??
                        category.max_entries_per_participant ??
                        3}{" "}
                      bài
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setForm(formFromRecord(category));
                        setEditingId(category.id);
                      }}
                    >
                      <Pencil /> Sửa
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void handleToggle(category)}
                    >
                      {active ? "Vô hiệu hóa" : "Kích hoạt"}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
