"use client";

import { ArrowLeft, LoaderCircle, RefreshCw, Save } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  CriteriaEditor,
  criteriaTotal,
} from "@/components/contest/criteria-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import {
  fetchContestCategories,
  fetchCriteria,
  saveCriteria,
  toContestConfigError,
} from "@/lib/contest-config-api";
import { criteriaErrorForTotal } from "@/lib/contest-config-validation";
import type { CategoryRecord, CriterionConfig } from "@/types/contest-config";

export function CriteriaConfigClient() {
  const searchParams = useSearchParams();
  const contestId =
    searchParams.get("contestId") ?? searchParams.get("id") ?? "";
  const initialCategoryId = searchParams.get("categoryId") ?? "";

  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryId);
  const [criteria, setCriteria] = useState<CriterionConfig[]>([]);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const criteriaRequestRef = useRef(0);

  const loadCategories = useCallback(async () => {
    if (!contestId) {
      setError("Thiếu mã cuộc thi (contestId) trên URL.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const records = await fetchContestCategories(contestId);
      setCategories(records);
      setSelectedCategory((current) => current || records[0]?.id || "");
    } catch (loadError) {
      const mapped = toContestConfigError(loadError);
      setError(mapped.message);
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  const loadCriteria = useCallback(async () => {
    if (!contestId || !selectedCategory) return;
    const requestId = ++criteriaRequestRef.current;
    setLoading(true);
    setError(null);
    try {
      const records = await fetchCriteria(contestId, selectedCategory);
      if (requestId !== criteriaRequestRef.current) return;
      setCriteria(records);
      setDirty(false);
    } catch (loadError) {
      if (requestId !== criteriaRequestRef.current) return;
      const mapped = toContestConfigError(loadError);
      setCriteria([]);
      setDirty(false);
      setError(mapped.message);
    } finally {
      if (requestId === criteriaRequestRef.current) setLoading(false);
    }
  }, [contestId, selectedCategory]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadCriteria();
  }, [loadCriteria]);

  const handleReload = async () => {
    if (
      dirty &&
      !window.confirm(
        "Bạn có thay đổi chưa lưu. Tải lại sẽ bỏ các thay đổi đó. Tiếp tục?",
      )
    ) {
      return;
    }
    await loadCategories();
    await loadCriteria();
  };

  const totalError = criteriaErrorForTotal(criteriaTotal(criteria));

  const handleSave = async () => {
    if (!contestId || !selectedCategory) return;
    setError(null);
    if (totalError) {
      setError(totalError.message);
      return;
    }

    setSaving(true);
    try {
      await saveCriteria(contestId, selectedCategory, criteria);
      setDirty(false);
      toast.success("Đã lưu cấu hình tiêu chí thành công.");
    } catch (saveError) {
      const mapped = toContestConfigError(saveError);
      setError(mapped.message);
      toast.error(mapped.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/portal/contests"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 size-4" /> Quay lại danh sách cuộc thi
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Cấu hình tiêu chí chấm điểm
            {dirty && (
              <span className="ml-2 text-sm font-normal text-amber-600">
                Chưa lưu
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            UC-14 · BR-15: tổng trọng số từng hạng mục phải bằng đúng 100%.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleReload()}
          disabled={loading}
        >
          <RefreshCw /> Tải lại
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tiêu chí theo hạng mục</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" /> Đang tải dữ liệu
              cấu hình...
            </p>
          ) : categories.length === 0 ? (
            <EmptyState
              title="Không tìm thấy kết quả phù hợp."
              description="Không có hạng mục để cấu hình tiêu chí. Vui lòng thêm hạng mục trước (UC-13)."
            />
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="criteria-category">Hạng mục *</Label>
                <select
                  id="criteria-category"
                  value={selectedCategory}
                  onChange={(event) => {
                    const nextCategory = event.target.value;
                    if (
                      nextCategory !== selectedCategory &&
                      dirty &&
                      !window.confirm(
                        "Bạn có thay đổi chưa lưu. Tải lại sẽ bỏ các thay đổi đó. Tiếp tục?",
                      )
                    ) {
                      return;
                    }
                    setSelectedCategory(nextCategory);
                  }}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <CriteriaEditor
                criteria={criteria}
                onChange={(next) => {
                  setCriteria(next);
                  setDirty(true);
                }}
                error={totalError?.message}
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving || Boolean(totalError)}
                >
                  {saving ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <Save />
                  )}{" "}
                  Lưu cấu hình
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
