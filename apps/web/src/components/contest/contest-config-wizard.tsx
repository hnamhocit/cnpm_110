"use client";

import {
  ArrowLeft,
  ArrowRight,
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  CriteriaEditor,
  criteriaTotal,
} from "@/components/contest/criteria-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createContestConfig,
  duplicateContestConfig,
  fetchContestCategories,
  fetchContestConfig,
  splitDescription,
  toContestConfigError,
  toDateTimeLocal,
  updateContestConfig,
} from "@/lib/contest-config-api";
import {
  criteriaErrorForTotal,
  hasValidationErrors,
  MSG008_INVALID_TIMELINE,
  validateContestConfig,
  validateContestUpdateInput,
} from "@/lib/contest-config-validation";
import {
  type AwardConfig,
  type CategoryConfig,
  type CategoryRecord,
  CONTEST_STATUS_LABELS,
  CONTEST_TIMELINE_LABELS,
  type ContestConfigInput,
  type ContestConfigRecord,
  type ContestStatus,
  type ContestTimeline,
  DEFAULT_MAX_SCORE,
  FORMAT_RESTRICTION_LABELS,
  type FormatRestriction,
  fromPercent,
  isFormatRestriction,
  normalizeContestStatus,
  round4,
  toPercent,
} from "@/types/contest-config";

type WizardMode = "create" | "edit" | "duplicate";

type ContestConfigWizardProps = {
  mode: WizardMode;
  contestId?: string;
  sourceId?: string;
};

const STEPS = [
  "Thông tin chung & lịch trình",
  "Hạng mục",
  "Tiêu chí chấm điểm",
  "Giải thưởng & xác nhận",
];

const TIMELINE_FIELDS: (keyof ContestTimeline)[] = [
  "registrationStartAt",
  "submissionDeadlineAt",
  "judgingStartAt",
  "judgingDeadlineAt",
  "publishedAt",
];

function defaultCriteria(): ContestConfigInput["categories"][number]["criteria"] {
  return [
    {
      code: "COMP",
      name: "Bố cục & Khoảnh khắc",
      weight: fromPercent(40),
      maxScore: DEFAULT_MAX_SCORE,
    },
    {
      code: "TONE",
      name: "Màu sắc & Hạt phim",
      weight: fromPercent(35),
      maxScore: DEFAULT_MAX_SCORE,
    },
    {
      code: "STORY",
      name: "Thông điệp tác phẩm",
      weight: fromPercent(25),
      maxScore: DEFAULT_MAX_SCORE,
    },
  ];
}

function defaultAwards(): AwardConfig[] {
  return [
    {
      code: "FIRST_PRIZE",
      name: "Giải Nhất Chung Cuộc",
      rankOrder: 1,
      prizeValueVnd: 20_000_000,
      quota: 1,
    },
    {
      code: "SECOND_PRIZE",
      name: "Giải Nhì",
      rankOrder: 2,
      prizeValueVnd: 10_000_000,
      quota: 2,
    },
  ];
}

function emptyInput(): ContestConfigInput {
  return {
    name: "",
    slug: "",
    theme: "",
    rules: "",
    coverImageUrl: "",
    registrationStartAt: "",
    submissionDeadlineAt: "",
    judgingStartAt: "",
    judgingDeadlineAt: "",
    publishedAt: "",
    maxEntriesPerUser: 5,
    categories: [
      {
        code: "CAT-35",
        name: "",
        formatRestriction: "ALL",
        maxEntriesPerParticipant: 3,
        requireNegativeProofUpfront: false,
        criteria: defaultCriteria(),
      },
    ],
    awards: defaultAwards(),
    status: "DRAFT",
  };
}

function categoryFromRecord(
  record: CategoryRecord,
  index: number,
): CategoryConfig {
  const format = record.formatRestriction ?? record.format_restriction ?? "ALL";
  return {
    id: record.id,
    code: record.code || `CAT-${index + 1}`,
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
    criteria: defaultCriteria(),
  };
}

function timelineFromRecord(record: ContestConfigRecord): ContestTimeline {
  return {
    registrationStartAt: toDateTimeLocal(
      record.registrationStartAt ??
        record.registration_start_at ??
        record.startAt ??
        record.start_at,
    ),
    submissionDeadlineAt: toDateTimeLocal(
      record.submissionDeadlineAt ?? record.submission_deadline_at,
    ),
    judgingStartAt: toDateTimeLocal(
      record.judgingStartAt ?? record.judging_start_at,
    ),
    judgingDeadlineAt: toDateTimeLocal(
      record.judgingDeadlineAt ??
        record.judging_deadline_at ??
        record.endAt ??
        record.end_at,
    ),
    publishedAt: toDateTimeLocal(
      record.publishedAt ??
        record.published_at ??
        record.endAt ??
        record.end_at,
    ),
  };
}

function inputFromRecords(
  record: ContestConfigRecord,
  categories: CategoryRecord[],
): ContestConfigInput {
  const { theme, rules } = splitDescription(record.description);
  const base = emptyInput();
  return {
    ...base,
    name: record.name ?? "",
    slug: record.slug ?? "",
    theme: record.theme ?? theme,
    rules: record.rules ?? rules,
    coverImageUrl: record.coverImageUrl ?? "",
    ...timelineFromRecord(record),
    maxEntriesPerUser: record.maxEntriesPerUser ?? base.maxEntriesPerUser,
    categories: categories.length
      ? categories.map(categoryFromRecord)
      : record.categories?.length
        ? record.categories
        : base.categories,
    awards: record.awards?.length ? record.awards : base.awards,
    status: normalizeContestStatus(record.status),
  };
}

function isLockedStatus(status: ContestStatus): boolean {
  return ["RESULTS_PUBLISHED", "ARCHIVED", "IN_JUDGING"].includes(status);
}

export function ContestConfigWizard({
  mode,
  contestId,
  sourceId,
}: ContestConfigWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<ContestConfigInput>(emptyInput);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [loading, setLoading] = useState(mode !== "create");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const requestRef = useRef(0);

  const loadSource = useCallback(async () => {
    if (mode === "create") return;
    const id = mode === "edit" ? contestId : sourceId;
    if (!id) {
      setLoadError("Thiếu mã cuộc thi để tải cấu hình.");
      setLoading(false);
      return;
    }

    const requestId = ++requestRef.current;
    setLoading(true);
    setLoadError(null);
    setBanner(null);
    setTouched({});

    try {
      const [record, categories] = await Promise.all([
        fetchContestConfig(id),
        fetchContestCategories(id),
      ]);
      if (requestId !== requestRef.current) return;
      const next = inputFromRecords(record, categories);
      if (mode === "duplicate") {
        setInput({
          ...next,
          name: `${record.name} (Sao chép)`,
          slug: "",
          registrationStartAt: "",
          submissionDeadlineAt: "",
          judgingStartAt: "",
          judgingDeadlineAt: "",
          publishedAt: "",
          status: "DRAFT",
        });
        setBanner(
          "Chỉ sao chép cấu hình; không sao chép đăng ký/bài/điểm/kết quả (UC-11).",
        );
      } else {
        setInput(next);
        if (isLockedStatus(next.status)) {
          setBanner(
            "Cuộc thi đã đóng/khóa cấu hình (BR-16). Chỉ xem, không thể lưu thay đổi.",
          );
        }
      }
      setSelectedCategory(0);
    } catch (error) {
      if (requestId !== requestRef.current) return;
      setLoadError(toContestConfigError(error).message);
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [mode, contestId, sourceId]);

  useEffect(() => {
    void loadSource();
  }, [loadSource]);

  const errors = useMemo(
    () =>
      mode === "edit"
        ? validateContestUpdateInput(input)
        : validateContestConfig(input),
    [input, mode],
  );
  const markTouched = (key: string) =>
    setTouched((previous) =>
      previous[key] ? previous : { ...previous, [key]: true },
    );
  const errorFor = (key: string) => (touched[key] ? errors[key] : undefined);
  const categoryIndex = Math.min(
    selectedCategory,
    Math.max(input.categories.length - 1, 0),
  );
  const currentCategory = input.categories[categoryIndex];
  const criteria = currentCategory?.criteria ?? [];
  const total = criteriaTotal(criteria);
  const totalError = criteriaErrorForTotal(total);
  const timelineError =
    errors.submissionDeadlineAt?.code === "MSG008"
      ? errors.submissionDeadlineAt
      : errors.judgingStartAt?.code === "MSG008"
        ? errors.judgingStartAt
        : null;
  const showTimelineError =
    timelineError !== null && TIMELINE_FIELDS.some((key) => touched[key]);
  const locked = mode === "edit" && isLockedStatus(input.status);
  const canSave =
    !hasValidationErrors(errors) && !locked && !saving && !loading;
  const firstStepKeys: (keyof ContestConfigInput)[] = [
    "name",
    "slug",
    "theme",
    "rules",
    "maxEntriesPerUser",
    "status",
    ...TIMELINE_FIELDS,
  ];
  const canContinue =
    step === 0
      ? !firstStepKeys.some((key) => errors[key as string])
      : step === 1
        ? !Object.keys(errors).some((key) => key.startsWith("categories."))
        : step === 2
          ? totalError === null
          : true;

  const setField = <K extends keyof ContestConfigInput>(
    key: K,
    value: ContestConfigInput[K],
  ) => {
    setInput((previous) => ({ ...previous, [key]: value }));
  };

  const setTimeline = (key: keyof ContestTimeline, value: string) => {
    setInput((previous) => ({ ...previous, [key]: value }));
  };

  const updateCategory = (index: number, patch: Partial<CategoryConfig>) => {
    setInput((previous) => ({
      ...previous,
      categories: previous.categories.map((category, current) =>
        current === index ? { ...category, ...patch } : category,
      ),
    }));
  };

  const updateAward = (index: number, patch: Partial<AwardConfig>) => {
    setInput((previous) => ({
      ...previous,
      awards: previous.awards.map((award, current) =>
        current === index ? { ...award, ...patch } : award,
      ),
    }));
  };

  const submit = async (status: ContestStatus) => {
    if (!canSave) return;
    setSaving(true);
    setLoadError(null);
    const payload: ContestConfigInput = { ...input, status };

    try {
      if (mode === "duplicate" && sourceId) {
        const created = await duplicateContestConfig(sourceId, payload);
        if (!created?.id) throw new Error("Thiếu mã cuộc thi sau khi sao chép.");
        toast.success(`Sao chép cuộc thi "${payload.name}" thành công.`);
        router.push(`/portal/contests/${created.id}`);
      } else if (mode === "edit" && contestId) {
        await updateContestConfig(contestId, payload);
        toast.success("Đã cập nhật cấu hình cuộc thi.");
        router.push(`/portal/contests/${contestId}`);
      } else {
        const created = await createContestConfig(payload);
        if (!created?.id) throw new Error("Thiếu mã cuộc thi sau khi tạo.");
        toast.success(`Khởi tạo cuộc thi "${payload.name}" thành công.`);
        router.push(`/portal/contests/${created.id}`);
      }
      router.refresh();
    } catch (error) {
      const mapped = toContestConfigError(error);
      setLoadError(mapped.message);
      toast.error(mapped.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-10 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" /> Đang tải cấu hình
          cuộc thi...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/portal/contests"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 size-4" /> Quay lại danh sách
        </Link>
        <Badge variant="outline">
          {mode === "create"
            ? "Tạo mới"
            : mode === "edit"
              ? "Chỉnh sửa"
              : "Sao chép"}
        </Badge>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {mode === "create"
            ? "Khởi tạo cuộc thi"
            : mode === "edit"
              ? "Chỉnh sửa cấu hình cuộc thi"
              : "Sao chép cấu hình cuộc thi"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cấu hình theo UC-11–14: 5 mốc BR-08, hạng mục, trọng số 100% (BR-15)
          và giải thưởng.
        </p>
      </div>

      {banner && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>{banner}</span>
        </div>
      )}
      {loadError && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          <span>{loadError}</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void loadSource()}
          >
            <RefreshCw /> Thử lại
          </Button>
        </div>
      )}

      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-4">
        {STEPS.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => setStep(index)}
              className={`w-full rounded-lg border p-2 text-left text-xs font-medium transition ${
                step === index
                  ? "border-brand-solid bg-brand-soft text-brand-solid"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {index + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Bước {step + 1}: {STEPS[step]}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {step === 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="config-name">Tên cuộc thi *</Label>
                  <Input
                    id="config-name"
                    value={input.name}
                    onChange={(event) => {
                      markTouched("name");
                      setField("name", event.target.value);
                    }}
                    onBlur={() => markTouched("name")}
                    placeholder="VD: Hương Sắc Phim Màu 2026"
                    aria-invalid={Boolean(errorFor("name"))}
                  />
                  {errorFor("name") && (
                    <p className="text-xs text-red-600">
                      {errorFor("name")?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="config-slug">Slug (tùy chọn)</Label>
                  <Input
                    id="config-slug"
                    value={input.slug ?? ""}
                    onChange={(event) => {
                      markTouched("slug");
                      setField("slug", event.target.value);
                    }}
                    onBlur={() => markTouched("slug")}
                    placeholder="huong-sac-phim-mau-2026"
                    aria-invalid={Boolean(errorFor("slug"))}
                  />
                  {errorFor("slug") && (
                    <p className="text-xs text-red-600">
                      {errorFor("slug")?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="config-theme">Chủ đề *</Label>
                <Input
                  id="config-theme"
                  value={input.theme}
                  onChange={(event) => {
                    markTouched("theme");
                    setField("theme", event.target.value);
                  }}
                  onBlur={() => markTouched("theme")}
                  aria-invalid={Boolean(errorFor("theme"))}
                />
                {errorFor("theme") && (
                  <p className="text-xs text-red-600">
                    {errorFor("theme")?.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="config-rules">Thể lệ *</Label>
                <textarea
                  id="config-rules"
                  value={input.rules}
                  onChange={(event) => {
                    markTouched("rules");
                    setField("rules", event.target.value);
                  }}
                  onBlur={() => markTouched("rules")}
                  className="min-h-24 w-full rounded-lg border border-input bg-transparent p-2.5 text-sm"
                  aria-invalid={Boolean(errorFor("rules"))}
                />
                {errorFor("rules") && (
                  <p className="text-xs text-red-600">
                    {errorFor("rules")?.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="config-cover">URL ảnh bìa</Label>
                  <Input
                    id="config-cover"
                    value={input.coverImageUrl ?? ""}
                    onChange={(event) =>
                      setField("coverImageUrl", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="config-max-entries">
                    Số bài tối đa / thí sinh *
                  </Label>
                  <Input
                    id="config-max-entries"
                    type="number"
                    min={1}
                    max={10}
                    value={input.maxEntriesPerUser}
                    onChange={(event) => {
                      markTouched("maxEntriesPerUser");
                      setField(
                        "maxEntriesPerUser",
                        Number(event.target.value),
                      );
                    }}
                    onBlur={() => markTouched("maxEntriesPerUser")}
                    aria-invalid={Boolean(errorFor("maxEntriesPerUser"))}
                  />
                  {errorFor("maxEntriesPerUser") && (
                    <p className="text-xs text-red-600">
                      {errorFor("maxEntriesPerUser")?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <div>
                  <h3 className="text-sm font-semibold">
                    Lịch trình 5 mốc (BR-08)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Đăng ký &lt; Nộp bài &lt; Bắt đầu chấm &lt; Kết thúc chấm
                    &lt; Công bố.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {TIMELINE_FIELDS.map((key) => (
                    <div key={key} className="space-y-1.5">
                      <Label htmlFor={`timeline-${key}`}>
                        {CONTEST_TIMELINE_LABELS[key]} *
                      </Label>
                      <Input
                        id={`timeline-${key}`}
                        type="datetime-local"
                        value={input[key]}
                        onChange={(event) => {
                          markTouched(key);
                          setTimeline(key, event.target.value);
                        }}
                        onBlur={() => markTouched(key)}
                        aria-invalid={Boolean(errorFor(key))}
                      />
                      {errorFor(key) && (
                        <p className="text-xs text-red-600">
                          {errorFor(key)?.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {showTimelineError && (
                  <p className="rounded-md border border-red-200 bg-red-50 p-2 text-xs font-medium text-red-600">
                    {MSG008_INVALID_TIMELINE}
                  </p>
                )}
              </div>
            </>
          )}

          {step === 1 && (
            <div className="space-y-4">
              {input.categories.length === 0 && (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Chưa có hạng mục. Thêm ít nhất một hạng mục để tiếp tục.
                </p>
              )}
              {errorFor("categories") && (
                <p className="text-xs font-medium text-red-600">
                  {errorFor("categories")?.message}
                </p>
              )}
              {input.categories.map((category, index) => (
                <div
                  key={category.id ?? `category-${index}`}
                  className="space-y-3 rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      Hạng mục {index + 1}
                    </h3>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      aria-label={`Xóa hạng mục ${index + 1}`}
                      disabled={input.categories.length <= 1}
                      onClick={() =>
                        setInput((previous) => ({
                          ...previous,
                          categories: previous.categories.filter(
                            (_, current) => current !== index,
                          ),
                        }))
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor={`category-code-${index}`}>
                        Mã hạng mục
                      </Label>
                      <Input
                        id={`category-code-${index}`}
                        value={category.code}
                        onChange={(event) =>
                          updateCategory(index, { code: event.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`category-name-${index}`}>
                        Tên hạng mục *
                      </Label>
                      <Input
                        id={`category-name-${index}`}
                        value={category.name}
                        onChange={(event) => {
                          markTouched("categories");
                          markTouched(`categories.${index}.name`);
                          updateCategory(index, { name: event.target.value });
                        }}
                        onBlur={() => {
                          markTouched("categories");
                          markTouched(`categories.${index}.name`);
                        }}
                        aria-invalid={Boolean(
                          errorFor(`categories.${index}.name`),
                        )}
                      />
                      {errorFor(`categories.${index}.name`) && (
                        <p className="text-xs text-red-600">
                          {errorFor(`categories.${index}.name`)?.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`category-format-${index}`}>
                        Khổ phim
                      </Label>
                      <select
                        id={`category-format-${index}`}
                        value={category.formatRestriction}
                        onChange={(event) =>
                          updateCategory(index, {
                            formatRestriction: event.target
                              .value as FormatRestriction,
                          })
                        }
                        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                      >
                        {(
                          Object.keys(
                            FORMAT_RESTRICTION_LABELS,
                          ) as FormatRestriction[]
                        ).map((format) => (
                          <option key={format} value={format}>
                            {FORMAT_RESTRICTION_LABELS[format]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`category-max-${index}`}>
                        Số bài tối đa / thí sinh
                      </Label>
                      <Input
                        id={`category-max-${index}`}
                        type="number"
                        min={1}
                        max={10}
                        value={category.maxEntriesPerParticipant}
                        onChange={(event) => {
                          markTouched("categories");
                          markTouched(
                            `categories.${index}.maxEntriesPerParticipant`,
                          );
                          updateCategory(index, {
                            maxEntriesPerParticipant: Number(
                              event.target.value,
                            ),
                          });
                        }}
                        onBlur={() => {
                          markTouched("categories");
                          markTouched(
                            `categories.${index}.maxEntriesPerParticipant`,
                          );
                        }}
                        aria-invalid={Boolean(
                          errorFor(
                            `categories.${index}.maxEntriesPerParticipant`,
                          ),
                        )}
                      />
                      {errorFor(
                        `categories.${index}.maxEntriesPerParticipant`,
                      ) && (
                        <p className="text-xs text-red-600">
                          {errorFor(
                            `categories.${index}.maxEntriesPerParticipant`,
                          )?.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`category-proof-${index}`}
                      checked={category.requireNegativeProofUpfront}
                      onCheckedChange={(checked) =>
                        updateCategory(index, {
                          requireNegativeProofUpfront: checked === true,
                        })
                      }
                    />
                    <Label htmlFor={`category-proof-${index}`}>
                      Bắt buộc nộp ảnh âm bản ngay (BR-06)
                    </Label>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed"
                onClick={() =>
                  setInput((previous) => ({
                    ...previous,
                    categories: [
                      ...previous.categories,
                      {
                        code: `CAT-${previous.categories.length + 1}`,
                        name: "",
                        formatRestriction: "ALL",
                        maxEntriesPerParticipant: 3,
                        requireNegativeProofUpfront: false,
                        criteria: defaultCriteria(),
                      },
                    ],
                  }))
                }
              >
                <Plus /> Thêm hạng mục
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="criteria-category">Hạng mục áp dụng</Label>
                <select
                  id="criteria-category"
                  value={categoryIndex}
                  onChange={(event) =>
                    setSelectedCategory(Number(event.target.value))
                  }
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                >
                  {input.categories.map((category, index) => (
                    <option
                      key={category.id ?? `option-${index}`}
                      value={index}
                    >
                      {category.name || `Hạng mục ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>
              <CriteriaEditor
                criteria={criteria}
                onChange={(next) =>
                  updateCategory(categoryIndex, { criteria: next })
                }
                error={
                  totalError?.message ??
                  errors[`categories.${categoryIndex}.criteria`]?.message
                }
              />
              {criteria.map((criterion, index) => (
                <div
                  key={`${criterion.code}-${index}`}
                  className="flex flex-wrap gap-2 text-xs"
                >
                  {errors[
                    `categories.${categoryIndex}.criteria.${index}.name`
                  ] && (
                    <p className="text-red-600">
                      {
                        errors[
                          `categories.${categoryIndex}.criteria.${index}.name`
                        ].message
                      }
                    </p>
                  )}
                  {errors[
                    `categories.${categoryIndex}.criteria.${index}.weight`
                  ] && (
                    <p className="text-red-600">
                      {
                        errors[
                          `categories.${categoryIndex}.criteria.${index}.weight`
                        ].message
                      }
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-3">
                {input.awards.map((award, index) => (
                  <div
                    key={award.code}
                    className="grid gap-3 rounded-lg border p-4 sm:grid-cols-5"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor={`award-code-${index}`}>Mã giải</Label>
                      <Input
                        id={`award-code-${index}`}
                        value={award.code}
                        onChange={(event) =>
                          updateAward(index, { code: event.target.value })
                        }
                        aria-invalid={Boolean(errors[`awards.${index}.code`])}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor={`award-name-${index}`}>Tên giải</Label>
                      <Input
                        id={`award-name-${index}`}
                        value={award.name}
                        onChange={(event) =>
                          updateAward(index, { name: event.target.value })
                        }
                        aria-invalid={Boolean(errors[`awards.${index}.name`])}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`award-rank-${index}`}>Thứ hạng</Label>
                      <Input
                        id={`award-rank-${index}`}
                        type="number"
                        min={1}
                        value={award.rankOrder}
                        onChange={(event) =>
                          updateAward(index, {
                            rankOrder: Number(event.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        aria-label={`Xóa giải ${index + 1}`}
                        onClick={() =>
                          setInput((previous) => ({
                            ...previous,
                            awards: previous.awards.filter(
                              (_, current) => current !== index,
                            ),
                          }))
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`award-prize-${index}`}>
                        Giá trị (VND)
                      </Label>
                      <Input
                        id={`award-prize-${index}`}
                        type="number"
                        min={0}
                        value={award.prizeValueVnd}
                        onChange={(event) =>
                          updateAward(index, {
                            prizeValueVnd: Number(event.target.value),
                          })
                        }
                      />
                      {errors[`awards.${index}.prizeValueVnd`] && (
                        <p className="text-xs text-red-600">
                          {errors[`awards.${index}.prizeValueVnd`].message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor={`award-quota-${index}`}>Số lượng</Label>
                      <Input
                        id={`award-quota-${index}`}
                        type="number"
                        min={1}
                        value={award.quota}
                        onChange={(event) =>
                          updateAward(index, {
                            quota: Number(event.target.value),
                          })
                        }
                      />
                      {errors[`awards.${index}.quota`] && (
                        <p className="text-xs text-red-600">
                          {errors[`awards.${index}.quota`].message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() =>
                    setInput((previous) => ({
                      ...previous,
                      awards: [
                        ...previous.awards,
                        {
                          code: `AWARD-${previous.awards.length + 1}`,
                          name: "",
                          rankOrder: previous.awards.length + 1,
                          prizeValueVnd: 0,
                          quota: 1,
                        },
                      ],
                    }))
                  }
                >
                  <Plus /> Thêm giải thưởng
                </Button>
              </div>

              <div className="rounded-lg border bg-muted/20 p-4 text-sm">
                <h3 className="font-semibold">Tổng kết cấu hình</h3>
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Tên cuộc thi</dt>
                    <dd className="font-medium">{input.name || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Trạng thái</dt>
                    <dd className="font-medium">
                      {CONTEST_STATUS_LABELS[input.status]}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Hạng mục</dt>
                    <dd className="font-medium">{input.categories.length}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Giải thưởng</dt>
                    <dd className="font-medium">{input.awards.length}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Tổng trọng số</dt>
                    <dd className="font-medium">{round4(toPercent(total))}%</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Mốc công bố</dt>
                    <dd className="font-medium">{input.publishedAt || "—"}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={step === 0}
          onClick={() => setStep((current) => Math.max(current - 1, 0))}
        >
          <ArrowLeft /> Quay lại bước trước
        </Button>
        <div className="flex flex-wrap gap-2">
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              disabled={!canContinue}
              onClick={() =>
                setStep((current) => Math.min(current + 1, STEPS.length - 1))
              }
            >
              Tiếp tục <ArrowRight />
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={!canSave}
                onClick={() => void submit("DRAFT")}
              >
                <Save /> Lưu DRAFT
              </Button>
              <Button
                type="button"
                disabled={!canSave}
                onClick={() => void submit("OPEN")}
              >
                {saving ? <LoaderCircle className="animate-spin" /> : <Save />}{" "}
                Lưu & Xuất bản
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
