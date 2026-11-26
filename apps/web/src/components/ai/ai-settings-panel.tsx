"use client";

import { Loader2, Lock, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getAiErrorMessage,
  getAiThresholds,
  updateAiThresholds,
} from "@/lib/ai-api";
import {
  AI_FLAG_THRESHOLD_FALLBACK,
  previewThresholdCheck,
  validateThresholdUpdate,
} from "@/lib/ai-validation";
import { fetchCurrentUserRole } from "@/lib/master-data-api";
import type { AiThresholds } from "@/types/ai";

const DEFAULT_DUPLICATE_DISTANCE = 5;
const ACCESS_DENIED =
  "Bạn không có quyền thực hiện thao tác này. / Access denied.";

type FormState = {
  aiGeneratedFlagThreshold: string;
  duplicateMaxPhashDistance: string;
};

type PreviewState = {
  probability: string;
  similarity: string;
  phashDistance: string;
  targetCode: string;
};

function toFormState(value: AiThresholds): FormState {
  return {
    aiGeneratedFlagThreshold: String(value.aiGeneratedFlagThreshold),
    duplicateMaxPhashDistance: String(value.duplicateMaxPhashDistance),
  };
}

export default function AiSettingsPanel() {
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [thresholds, setThresholds] = useState<AiThresholds | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    aiGeneratedFlagThreshold: String(AI_FLAG_THRESHOLD_FALLBACK),
    duplicateMaxPhashDistance: String(DEFAULT_DUPLICATE_DISTANCE),
  });
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof AiThresholds, string>>
  >({});
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<PreviewState>({
    probability: "75",
    similarity: "92",
    phashDistance: String(DEFAULT_DUPLICATE_DISTANCE),
    targetCode: "",
  });
  const [previewResults, setPreviewResults] = useState<string[] | null>(null);

  const allowed = role === "Admin" || role === "Organizer";
  const canEdit = role === "Admin";

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
    if (!allowed) return;
    let active = true;
    setLoading(true);
    setLoadError(null);
    getAiThresholds()
      .then((value) => {
        if (!active) return;
        setThresholds(value);
        setForm(toFormState(value));
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(getAiErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [allowed]);

  const buildPayload = (): Partial<AiThresholds> => {
    const payload: Partial<AiThresholds> = {};
    const probability = form.aiGeneratedFlagThreshold.trim();
    const distance = form.duplicateMaxPhashDistance.trim();

    if (
      probability !== "" &&
      Number(probability) !== thresholds?.aiGeneratedFlagThreshold
    ) {
      payload.aiGeneratedFlagThreshold = Number(probability);
    }
    if (
      distance !== "" &&
      Number(distance) !== thresholds?.duplicateMaxPhashDistance
    ) {
      payload.duplicateMaxPhashDistance = Number(distance);
    }
    return payload;
  };

  async function handleSave() {
    const payload = buildPayload();
    if (Object.keys(payload).length === 0) {
      toast.info("Không có thay đổi ngưỡng để lưu.");
      return;
    }

    const errors = validateThresholdUpdate(payload);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      await updateAiThresholds(payload);
      toast.success("Đã cập nhật ngưỡng AI.");
      const latest = await getAiThresholds();
      setThresholds(latest);
      setForm(toFormState(latest));
    } catch (error) {
      toast.error(getAiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function handlePreview() {
    const probability = Number(preview.probability) / 100;
    const similarity = Number(preview.similarity) / 100;
    const phashDistance = Number(preview.phashDistance);
    if (
      !Number.isFinite(probability) ||
      !Number.isFinite(similarity) ||
      !Number.isFinite(phashDistance)
    ) {
      setPreviewResults(["Vui lòng nhập số hợp lệ để thử ngưỡng."]);
      return;
    }

    const current = thresholds ?? {
      aiGeneratedFlagThreshold: AI_FLAG_THRESHOLD_FALLBACK,
      duplicateMaxPhashDistance: DEFAULT_DUPLICATE_DISTANCE,
    };
    setPreviewResults(
      previewThresholdCheck({
        probability,
        similarity,
        phashDistance,
        targetCode: preview.targetCode,
        thresholds: current,
      }),
    );
  }

  if (roleLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Đang kiểm tra quyền truy cập…
      </div>
    );
  }

  if (!allowed) {
    return (
      <Card role="alert" className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="flex items-start gap-2.5 pt-4 text-sm text-amber-800 dark:text-amber-300">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          <span>{ACCESS_DENIED}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {loadError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {loadError}
        </div>
      )}

      <Card>
        <CardHeader className="border-b pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Ngưỡng cảnh báo</CardTitle>
            {!canEdit && (
              <Badge variant="outline" className="gap-1">
                <Lock className="size-3" />
                Chỉ đọc
              </Badge>
            )}
          </div>
          <CardDescription>
            UC-09 (SRS): Admin được kiểm thử; không giao diện tinh chỉnh chuyên
            sâu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ai-flag-threshold">
                Ngưỡng điểm nghi vấn AI (0–1)
              </Label>
              <Input
                id="ai-flag-threshold"
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={form.aiGeneratedFlagThreshold}
                disabled={!canEdit || loading}
                aria-invalid={Boolean(formErrors.aiGeneratedFlagThreshold)}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    aiGeneratedFlagThreshold: event.target.value,
                  }))
                }
              />
              {formErrors.aiGeneratedFlagThreshold && (
                <p className="text-xs text-destructive">
                  {formErrors.aiGeneratedFlagThreshold}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phash-distance">
                Khoảng cách pHash tối đa (0–64)
              </Label>
              <Input
                id="phash-distance"
                type="number"
                min={0}
                max={64}
                step={1}
                value={form.duplicateMaxPhashDistance}
                disabled={!canEdit || loading}
                aria-invalid={Boolean(formErrors.duplicateMaxPhashDistance)}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    duplicateMaxPhashDistance: event.target.value,
                  }))
                }
              />
              {formErrors.duplicateMaxPhashDistance && (
                <p className="text-xs text-destructive">
                  {formErrors.duplicateMaxPhashDistance}
                </p>
              )}
            </div>
          </div>

          {canEdit && (
            <Button
              type="button"
              disabled={saving || loading}
              onClick={() => void handleSave()}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Lưu ngưỡng
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            Chỉ hai ngưỡng được cấu hình; Organizer xem ở chế độ chỉ đọc. Quyết
            định duyệt hoặc loại bài luôn do Ban tổ chức đưa ra.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle>Thử ngưỡng</CardTitle>
          <CardDescription>
            Ước tính tại client theo ngưỡng hiện tại — không thay thế kết quả
            AI thật.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="preview-probability">Điểm nghi vấn AI (%)</Label>
              <Input
                id="preview-probability"
                type="number"
                min={0}
                max={100}
                step={1}
                value={preview.probability}
                onChange={(event) =>
                  setPreview((prev) => ({
                    ...prev,
                    probability: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preview-similarity">Độ tương đồng (%)</Label>
              <Input
                id="preview-similarity"
                type="number"
                min={0}
                max={100}
                step={1}
                value={preview.similarity}
                onChange={(event) =>
                  setPreview((prev) => ({
                    ...prev,
                    similarity: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preview-distance">Khoảng cách pHash</Label>
              <Input
                id="preview-distance"
                type="number"
                min={0}
                max={64}
                step={1}
                value={preview.phashDistance}
                onChange={(event) =>
                  setPreview((prev) => ({
                    ...prev,
                    phashDistance: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preview-target">Mã bài dự thi đối chiếu</Label>
              <Input
                id="preview-target"
                value={preview.targetCode}
                placeholder="SUB-YYYY-XXXX"
                onChange={(event) =>
                  setPreview((prev) => ({
                    ...prev,
                    targetCode: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <Button type="button" variant="outline" onClick={handlePreview}>
            Thử ngưỡng
          </Button>

          {previewResults && (
            <div
              role="status"
              className="space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300"
            >
              {previewResults.length > 0 ? (
                previewResults.map((warning) => <p key={warning}>{warning}</p>)
              ) : (
                <p>Không vượt ngưỡng</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
