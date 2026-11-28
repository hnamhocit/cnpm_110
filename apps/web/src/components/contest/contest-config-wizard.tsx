"use client";

import {
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  TriangleAlert,
  UploadCloud,
  X,
} from "lucide-react";
import { cn } from "cn";
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
  deleteCategory,
  duplicateContestConfig,
  fetchContestCategories,
  fetchContestConfig,
  fetchCriteria,
  saveCategory,
  saveCriteria,
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
} from "@/lib/contest-config-validation";
import { http } from "@/lib/http";
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
  type CriterionConfig,
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

const TIMELINE_DEFAULT_TIMES: Record<keyof ContestTimeline, string> = {
  registrationStartAt: "09:00",
  submissionDeadlineAt: "23:59",
  judgingStartAt: "09:00",
  judgingDeadlineAt: "17:00",
  publishedAt: "10:00",
};

const TIMELINE_DESCRIPTIONS: Record<keyof ContestTimeline, string> = {
  registrationStartAt: "Mở cổng đăng ký cho thí sinh.",
  submissionDeadlineAt: "Khóa cổng nộp bài; quá hạn không nộp hoặc sửa bài.",
  judgingStartAt: "Bắt đầu chấm điểm và phân bài cho giám khảo.",
  judgingDeadlineAt: "Kết thúc chấm và khóa phiếu điểm.",
  publishedAt: "Công bố kết quả và bảng vàng.",
};

function splitDateTime(value?: string): { date: string; time: string } {
  const [date = "", time = ""] = (value ?? "").split("T");
  return { date, time: time.slice(0, 5) };
}

function joinDateTime(
  date: string,
  time: string,
  key: keyof ContestTimeline,
): string {
  if (!date) return "";
  return `${date}T${time || TIMELINE_DEFAULT_TIMES[key]}`;
}

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

function normalizeAwards(awards: AwardConfig[]): AwardConfig[] {
  const usedCodes = new Set<string>();
  return awards.map((award, index) => {
    const baseCode = award.code?.trim() || `AWARD-${index + 1}`;
    let code = baseCode;
    let suffix = index + 1;
    while (usedCodes.has(code)) {
      code = `${baseCode}-${suffix++}`;
    }
    usedCodes.add(code);
    return { ...award, code };
  });
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
  criteria?: CriterionConfig[],
): CategoryConfig {
  const format = record.formatRestriction ?? record.format_restriction ?? "ALL";
  return {
    id: record.id,
    code: record.code || `CAT-${index + 1}`,
    name: record.name,
    description: record.description,
    formatRestriction: isFormatRestriction(format) ? format : "ALL",
    maxEntriesPerParticipant:
      record.maxEntriesPerParticipant ??
      record.max_entries_per_participant ??
      3,
    requireNegativeProofUpfront:
      record.requireNegativeProofUpfront ??
      record.require_negative_proof_upfront ??
      false,
    criteria: criteria ?? defaultCriteria(),
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
  criteriaByCategory?: Map<string, CriterionConfig[]>,
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
      ? categories.map((category, index) =>
          categoryFromRecord(
            category,
            index,
            criteriaByCategory?.get(category.id),
          ),
        )
      : record.categories?.length
        ? record.categories
        : base.categories,
    awards: record.awards?.length
      ? normalizeAwards(record.awards)
      : base.awards,
    status: normalizeContestStatus(record.status),
  };
}

function isLockedStatus(status: ContestStatus): boolean {
  return ["RESULTS_PUBLISHED", "ARCHIVED", "IN_JUDGING"].includes(status);
}

async function syncCategoriesForEdit(
  contestId: string,
  categories: CategoryConfig[],
  existingCategories: CategoryRecord[],
): Promise<void> {
  const keptIds = new Set(
    categories
      .map((category) => category.id)
      .filter((id): id is string => Boolean(id)),
  );

  for (const existing of existingCategories) {
    if (!keptIds.has(existing.id)) {
      await deleteCategory(contestId, existing.id);
    }
  }

  for (const category of categories) {
    const saved = category.id
      ? await saveCategory(contestId, category, category.id)
      : await saveCategory(contestId, category);
    if (!saved?.id) throw new Error("Thiếu mã hạng mục sau khi lưu.");
    await saveCriteria(contestId, saved.id, category.criteria ?? []);
  }
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
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverFileName, setCoverFileName] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const [banner, setBanner] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [sourceCategories, setSourceCategories] = useState<CategoryRecord[]>(
    [],
  );
  const requestRef = useRef(0);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);

  const loadSource = useCallback(async () => {
    setSourceCategories([]);
    setCoverFileName(null);
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
      const criteriaByCategory = new Map<string, CriterionConfig[]>();
      await Promise.all(
        categories.map(async (category) => {
          const criteria = await fetchCriteria(id, category.id);
          criteriaByCategory.set(category.id, criteria);
        }),
      );
      if (requestId !== requestRef.current) return;
      const next = inputFromRecords(record, categories, criteriaByCategory);
      setSourceCategories(categories);
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
          "Chỉ tên và 5 mốc được chỉnh; các cấu hình khác được sao chép nguyên bản từ nguồn. Muốn đổi hãy mở trang Chỉnh sửa sau khi tạo.",
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

  const normalizedInput = useMemo(
    () => ({ ...input, awards: normalizeAwards(input.awards) }),
    [input],
  );
  const errors = useMemo(
    () => validateContestConfig(normalizedInput),
    [normalizedInput],
  );
  const errorsWithoutSlug = Object.fromEntries(
    Object.entries(errors).filter(([key]) => key !== "slug"),
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
  const readOnlyConfig = mode === "duplicate";
  const canSave =
    !hasValidationErrors(errorsWithoutSlug) &&
    !locked &&
    !saving &&
    !loading &&
    !loadError;
  const firstStepKeys: (keyof ContestConfigInput)[] = [
    "name",
    "theme",
    "rules",
    "maxEntriesPerUser",
    "status",
    ...TIMELINE_FIELDS,
  ];
  const categoryBasicErrorKeys = (): string[] =>
    input.categories.flatMap((_, index) => [
      `categories.${index}.name`,
      `categories.${index}.formatRestriction`,
      `categories.${index}.maxEntriesPerParticipant`,
    ]);
  const criteriaErrorKeys = (): string[] =>
    Object.keys(errors).filter(
      (key) => key.startsWith("categories.") && key.includes(".criteria"),
    );
  const criteriaTotalErrorForCategory = (index: number) =>
    criteriaErrorForTotal(
      criteriaTotal(input.categories[index]?.criteria ?? []),
    );

  const currentCriteriaInvalid = (): boolean =>
    criteriaTotalErrorForCategory(categoryIndex) !== null ||
    criteriaErrorKeys().some((key) =>
      key.startsWith(`categories.${categoryIndex}.criteria`),
    );

  const anyCriteriaInvalid = (): boolean =>
    input.categories.some(
      (_, index) =>
        criteriaTotalErrorForCategory(index) !== null ||
        criteriaErrorKeys().some((key) =>
          key.startsWith(`categories.${index}.criteria`),
        ),
    );

  const canContinue =
    step === 0
      ? !firstStepKeys.some((key) => errors[key as string])
      : step === 1
        ? !errors.categories &&
          !categoryBasicErrorKeys().some((key) => errors[key])
        : step === 2
          ? !currentCriteriaInvalid()
          : true;

  const firstInvalidStep = (): number | null => {
    if (firstStepKeys.some((key) => errors[key as string])) return 0;
    if (
      errors.categories ||
      categoryBasicErrorKeys().some((key) => errors[key])
    )
      return 1;
    if (anyCriteriaInvalid()) return 2;
    if (Object.keys(errors).some((key) => key.startsWith("awards."))) return 3;
    return null;
  };

  const touchedKeysForStep = (targetStep: number): string[] => {
    if (targetStep === 0) {
      return firstStepKeys.filter(
        (key) => key !== "status" || Boolean(errors[key as string]),
      );
    }
    if (targetStep === 1) {
      return [
        "categories",
        ...input.categories.flatMap((_, index) => [
          `categories.${index}.name`,
          `categories.${index}.formatRestriction`,
          `categories.${index}.maxEntriesPerParticipant`,
          `categories.${index}.criteria`,
          ...(input.categories[index]?.criteria ?? []).flatMap(
            (_, criterionIndex) => [
              `categories.${index}.criteria.${criterionIndex}.name`,
              `categories.${index}.criteria.${criterionIndex}.weight`,
            ],
          ),
        ]),
      ];
    }
    if (targetStep === 2) {
      return [
        `categories.${categoryIndex}.criteria`,
        ...criteria.flatMap((_, index) => [
          `categories.${categoryIndex}.criteria.${index}.name`,
          `categories.${categoryIndex}.criteria.${index}.weight`,
        ]),
      ];
    }
    return Object.keys(errors).filter((key) => key.startsWith("awards."));
  };

  const applyTouchedKeys = (keys: string[]) => {
    setTouched((previous) => ({
      ...previous,
      ...Object.fromEntries(keys.map((key) => [key, true])),
    }));
  };

  const markTouchedForStep = (targetStep: number) =>
    applyTouchedKeys(touchedKeysForStep(targetStep));

  const markStepTouched = () => markTouchedForStep(step);

  const markAllTouched = () =>
    applyTouchedKeys(
      [0, 1, 2, 3].flatMap((targetStep) => touchedKeysForStep(targetStep)),
    );

  const goToStep = (target: number) => {
    if (target <= step) {
      setStep(target);
      return;
    }
    const invalidStep = firstInvalidStep();
    if (invalidStep !== null && invalidStep < target) {
      markAllTouched();
      setStep(invalidStep);
      setValidationMessage(
        `Vui lòng hoàn tất bước ${invalidStep + 1}: ${STEPS[invalidStep]} trước khi tiếp tục.`,
      );
      return;
    }
    setStep(target);
  };

  const goNext = () => {
    if (!canContinue) {
      markStepTouched();
      setValidationMessage(
        `Vui lòng hoàn tất bước ${step + 1}: ${STEPS[step]} trước khi tiếp tục.`,
      );
      return;
    }
    setValidationMessage(null);
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const goSave = (status: ContestStatus) => {
    if (locked || loading) return;
    const invalidStep = firstInvalidStep();
    if (invalidStep !== null) {
      if (invalidStep === 2) {
        const firstCriteriaKey = criteriaErrorKeys()[0];
        const categoryMatch = firstCriteriaKey?.match(
          /^categories\.(\d+)\.criteria/,
        );
        const invalidCategory = categoryMatch
          ? Number(categoryMatch[1])
          : input.categories.findIndex(
              (_, index) => criteriaTotalErrorForCategory(index) !== null,
            );
        if (invalidCategory >= 0) setSelectedCategory(invalidCategory);
      }
      markAllTouched();
      setStep(invalidStep);
      setValidationMessage(
        `Vui lòng hoàn tất bước ${invalidStep + 1}: ${STEPS[invalidStep]} trước khi lưu.`,
      );
      return;
    }
    setValidationMessage(null);
    void submit(status);
  };

  const setField = <K extends keyof ContestConfigInput>(
    key: K,
    value: ContestConfigInput[K],
  ) => {
    setInput((previous) => ({ ...previous, [key]: value }));
  };

  const setTimeline = (key: keyof ContestTimeline, value: string) => {
    setInput((previous) => ({ ...previous, [key]: value }));
  };

  const uploadCoverImage = async (file: File | null) => {
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Vui lòng chọn ảnh JPG, PNG hoặc WebP.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Ảnh bìa tối đa 50 MB.");
      return;
    }

    setCoverFileName(file.name);
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await http.post("/api/v1/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const key = response.data?.data?.key;
      if (typeof key !== "string" || !key) {
        throw new Error("Thiếu key ảnh bìa.");
      }
      setField("coverImageUrl", key);
      toast.success("Đã tải ảnh bìa.");
    } catch (error) {
      toast.error(toContestConfigError(error).message);
    } finally {
      setUploadingCover(false);
    }
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
    setValidationMessage(null);
    setLoadError(null);
    const payload: ContestConfigInput = { ...normalizedInput, status };

    try {
      if (mode === "duplicate" && sourceId) {
        const created = await duplicateContestConfig(sourceId, payload);
        if (!created?.id) throw new Error("Thiếu mã cuộc thi sau khi sao chép.");
        await updateContestConfig(created.id, payload);
        toast.success(`Sao chép cuộc thi "${payload.name}" thành công.`);
        router.push(`/portal/contests/${created.id}`);
      } else if (mode === "edit" && contestId) {
        await updateContestConfig(contestId, payload);
        await syncCategoriesForEdit(
          contestId,
          payload.categories,
          sourceCategories,
        );
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
          <ArrowLeft className="mr-2 size-4" /> Quay lại danh sách cuộc thi
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
      {validationMessage && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-destructive">
          <span>{validationMessage}</span>
        </div>
      )}
      {loadError && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-destructive">
          <span>{loadError}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setLoadError(null);
                void loadSource();
              }}
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
              onClick={() => goToStep(index)}
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
                    <p className="text-xs text-destructive">
                      {errorFor("name")?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="config-theme">Chủ đề *</Label>
                <Input
                  id="config-theme"
                  value={input.theme}
                  disabled={readOnlyConfig}
                  onChange={(event) => {
                    markTouched("theme");
                    setField("theme", event.target.value);
                  }}
                  onBlur={() => markTouched("theme")}
                  aria-invalid={Boolean(errorFor("theme"))}
                />
                {errorFor("theme") && (
                  <p className="text-xs text-destructive">
                    {errorFor("theme")?.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="config-rules">Thể lệ *</Label>
                <textarea
                  id="config-rules"
                  value={input.rules}
                  disabled={readOnlyConfig}
                  onChange={(event) => {
                    markTouched("rules");
                    setField("rules", event.target.value);
                  }}
                  onBlur={() => markTouched("rules")}
                  className={cn(
                    "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
                    "min-h-24",
                  )}
                  aria-invalid={Boolean(errorFor("rules"))}
                />
                {errorFor("rules") && (
                  <p className="text-xs text-destructive">
                    {errorFor("rules")?.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="config-cover">URL ảnh bìa</Label>
                  <input
                    ref={coverFileInputRef}
                    id="config-cover-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={uploadingCover || readOnlyConfig}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      void uploadCoverImage(file);
                    }}
                  />
                  <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <ImageIcon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {coverFileName ?? "Chưa chọn ảnh bìa"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {uploadingCover
                          ? "Đang tải ảnh bìa..."
                          : input.coverImageUrl
                            ? "Ảnh sẵn sàng · có thể lưu cùng cuộc thi"
                            : "JPG, PNG hoặc WebP · tối đa 50 MB"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingCover || readOnlyConfig}
                        onClick={() => {
                          if (coverFileInputRef.current) {
                            coverFileInputRef.current.value = "";
                            coverFileInputRef.current.click();
                          }
                        }}
                      >
                        <UploadCloud />
                        {coverFileName ? "Đổi ảnh" : "Chọn ảnh"}
                      </Button>
                      {(coverFileName || input.coverImageUrl) &&
                        !readOnlyConfig && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Xóa ảnh bìa"
                            disabled={uploadingCover}
                            onClick={() => {
                              if (coverFileInputRef.current) {
                                coverFileInputRef.current.value = "";
                              }
                              setCoverFileName(null);
                              setField("coverImageUrl", "");
                            }}
                          >
                            <X />
                          </Button>
                        )}
                    </div>
                  </div>
                  <Input
                    id="config-cover"
                    value={input.coverImageUrl ?? ""}
                    disabled={readOnlyConfig}
                    onChange={(event) =>
                      setField("coverImageUrl", event.target.value)
                    }
                    placeholder="Hoặc dán URL ảnh bìa"
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
                    disabled={readOnlyConfig}
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
                    <p className="text-xs text-destructive">
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
                <div>
                  {TIMELINE_FIELDS.map((key, index) => {
                    const { date, time } = splitDateTime(input[key]);
                    return (
                      <div key={key} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-medium text-muted-foreground">
                            {index + 1}
                          </span>
                          {index < TIMELINE_FIELDS.length - 1 && (
                            <span className="mt-1 w-px flex-1 bg-border" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-2 pb-4">
                          <div className="grid gap-3 sm:grid-cols-[1fr_16rem]">
                            <div className="space-y-1">
                              <Label>
                                {index + 1}. {CONTEST_TIMELINE_LABELS[key]} *
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {TIMELINE_DESCRIPTIONS[key]}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1.5">
                                <Label
                                  htmlFor={`timeline-${key}-date`}
                                  className="sr-only"
                                >
                                  Ngày {CONTEST_TIMELINE_LABELS[key]}
                                </Label>
                                <Input
                                  id={`timeline-${key}-date`}
                                  type="date"
                                  value={date}
                                  disabled={readOnlyConfig}
                                  onChange={(event) => {
                                    markTouched(key);
                                    setTimeline(
                                      key,
                                      joinDateTime(
                                        event.target.value,
                                        time,
                                        key,
                                      ),
                                    );
                                  }}
                                  onBlur={() => markTouched(key)}
                                  aria-invalid={Boolean(errorFor(key))}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label
                                  htmlFor={`timeline-${key}-time`}
                                  className="sr-only"
                                >
                                  Giờ {CONTEST_TIMELINE_LABELS[key]}
                                </Label>
                                <Input
                                  id={`timeline-${key}-time`}
                                  type="time"
                                  value={time}
                                  disabled={readOnlyConfig}
                                  onChange={(event) => {
                                    markTouched(key);
                                    setTimeline(
                                      key,
                                      joinDateTime(
                                        date,
                                        event.target.value,
                                        key,
                                      ),
                                    );
                                  }}
                                  onBlur={() => markTouched(key)}
                                  aria-invalid={Boolean(errorFor(key))}
                                />
                              </div>
                            </div>
                          </div>
                          {errorFor(key) && (
                            <p className="text-xs text-destructive">
                              {errorFor(key)?.message}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {showTimelineError && (
                  <p className="rounded-md border border-red-200 bg-red-50 p-2 text-xs font-medium text-destructive">
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
                <p className="text-xs font-medium text-destructive">
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
                      disabled={readOnlyConfig || input.categories.length <= 1}
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
                        disabled={readOnlyConfig}
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
                        disabled={readOnlyConfig}
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
                        <p className="text-xs text-destructive">
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
                        disabled
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
                        disabled
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
                        <p className="text-xs text-destructive">
                          {errorFor(
                            `categories.${index}.maxEntriesPerParticipant`,
                          )?.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-amber-600">
                    API hiện chưa lưu 2 trường này; cần backend bổ sung.
                  </p>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`category-proof-${index}`}
                      disabled={readOnlyConfig}
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
                disabled={readOnlyConfig}
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
                  disabled={readOnlyConfig}
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
                disabled={readOnlyConfig}
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
                    <p className="text-destructive">
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
                    <p className="text-destructive">
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
                    className="grid gap-3 rounded-lg border p-4 sm:grid-cols-4"
                  >
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor={`award-name-${index}`}>Tên giải</Label>
                      <Input
                        id={`award-name-${index}`}
                        value={award.name}
                        disabled={readOnlyConfig}
                        onChange={(event) => {
                          markTouched(`awards.${index}.name`);
                          updateAward(index, { name: event.target.value });
                        }}
                        onBlur={() => markTouched(`awards.${index}.name`)}
                        aria-invalid={Boolean(
                          errorFor(`awards.${index}.name`),
                        )}
                      />
                      {errorFor(`awards.${index}.name`) && (
                        <p className="text-xs text-destructive">
                          {errorFor(`awards.${index}.name`)?.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`award-rank-${index}`}>Thứ hạng</Label>
                      <Input
                        id={`award-rank-${index}`}
                        type="number"
                        min={1}
                        disabled={readOnlyConfig}
                        value={award.rankOrder}
                        onChange={(event) => {
                          markTouched(`awards.${index}.rankOrder`);
                          updateAward(index, {
                            rankOrder: Number(event.target.value),
                          });
                        }}
                        onBlur={() => markTouched(`awards.${index}.rankOrder`)}
                        aria-invalid={Boolean(
                          errorFor(`awards.${index}.rankOrder`),
                        )}
                      />
                      {errorFor(`awards.${index}.rankOrder`) && (
                        <p className="text-xs text-destructive">
                          {errorFor(`awards.${index}.rankOrder`)?.message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        aria-label={`Xóa giải ${index + 1}`}
                        disabled={readOnlyConfig}
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
                        disabled={readOnlyConfig}
                        value={award.prizeValueVnd}
                        onChange={(event) =>
                          updateAward(index, {
                            prizeValueVnd: Number(event.target.value),
                          })
                        }
                      />
                      {errors[`awards.${index}.prizeValueVnd`] && (
                        <p className="text-xs text-destructive">
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
                        disabled={readOnlyConfig}
                        value={award.quota}
                        onChange={(event) =>
                          updateAward(index, {
                            quota: Number(event.target.value),
                          })
                        }
                      />
                      {errors[`awards.${index}.quota`] && (
                        <p className="text-xs text-destructive">
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
                  disabled={readOnlyConfig}
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

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={step === 0}
          onClick={() => setStep((current) => Math.max(current - 1, 0))}
        >
          <ArrowLeft /> Quay lại bước trước
        </Button>
        <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={saving}
              onClick={() => goNext()}
            >
              Tiếp tục <ArrowRight />
            </Button>
          ) : readOnlyConfig ? (
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={saving || locked || loading}
              onClick={() => goSave("DRAFT")}
            >
              {saving ? <LoaderCircle className="animate-spin" /> : <Save />}{" "}
              Sao chép
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={saving || locked || loading}
                onClick={() => goSave("DRAFT")}
              >
                <Save /> Lưu DRAFT
              </Button>
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={saving || locked || loading}
                onClick={() => goSave("OPEN")}
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
