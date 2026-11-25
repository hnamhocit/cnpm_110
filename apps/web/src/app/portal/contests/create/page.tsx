"use client";

import { ArrowLeft, ArrowRight, Check, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { http } from "@/lib/http";

const STEPS = [
  { id: 1, label: "Thông tin & Lịch trình" },
  { id: 2, label: "Hạng mục" },
  { id: 3, label: "Tiêu chí & Trọng số" },
  { id: 4, label: "Giải thưởng & Xác nhận" },
];

const FORMAT_OPTIONS = [
  { value: "ALL", label: "Không giới hạn" },
  { value: "135", label: "35mm (135)" },
  { value: "120", label: "Medium Format (120)" },
  { value: "4x5", label: "Large Format (4x5)" },
];

type Criterion = {
  key: string;
  name: string;
  weightPercent: number;
  maxScore: number;
};

type Category = {
  key: string;
  name: string;
  description: string;
  formatRestriction: string;
  maxEntriesPerParticipant: number;
  requireNegativeProofUpfront: boolean;
  criteria: Criterion[];
};

type Award = {
  key: string;
  name: string;
  rankOrder: number;
  prizeValueVnd: number;
  quota: number;
};

type Schedule = {
  registrationStartAt: string;
  submissionDeadlineAt: string;
  judgingStartAt: string;
  judgingDeadlineAt: string;
  publishedAt: string;
};

function newKey(): string {
  return crypto.randomUUID();
}

function newCriterion(): Criterion {
  return { key: newKey(), name: "", weightPercent: 0, maxScore: 10 };
}

function newCategory(): Category {
  return {
    key: newKey(),
    name: "",
    description: "",
    formatRestriction: "ALL",
    maxEntriesPerParticipant: 3,
    requireNegativeProofUpfront: false,
    criteria: [newCriterion()],
  };
}

function newAward(rankOrder: number): Award {
  return {
    key: newKey(),
    name: "",
    rankOrder,
    prizeValueVnd: 0,
    quota: 1,
  };
}

function weightTotal(criteria: Criterion[]): number {
  return criteria.reduce(
    (total, criterion) => total + Number(criterion.weightPercent || 0),
    0,
  );
}

function formatWeight(total: number): string {
  return Number.isInteger(total) ? `${total}` : total.toFixed(2);
}

export default function CreateContestPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [basic, setBasic] = useState({
    name: "",
    theme: "",
    description: "",
    rules: "",
    coverImageUrl: "",
    maxEntriesPerUser: 5,
  });
  const [schedule, setSchedule] = useState<Schedule>({
    registrationStartAt: "",
    submissionDeadlineAt: "",
    judgingStartAt: "",
    judgingDeadlineAt: "",
    publishedAt: "",
  });
  const [categories, setCategories] = useState<Category[]>([newCategory()]);
  const [awards, setAwards] = useState<Award[]>([newAward(1)]);

  const weightsValid = useMemo(
    () =>
      categories.every(
        (category) => Math.abs(weightTotal(category.criteria) - 100) < 0.0001,
      ),
    [categories],
  );

  function updateBasic(field: keyof typeof basic, value: string | number) {
    setBasic((prev) => ({ ...prev, [field]: value }));
  }

  function updateSchedule(field: keyof Schedule, value: string) {
    setSchedule((prev) => ({ ...prev, [field]: value }));
  }

  function updateCategory(key: string, patch: Partial<Category>) {
    setCategories((prev) =>
      prev.map((category) =>
        category.key === key ? { ...category, ...patch } : category,
      ),
    );
  }

  function updateCriterion(
    categoryKey: string,
    criterionKey: string,
    patch: Partial<Criterion>,
  ) {
    setCategories((prev) =>
      prev.map((category) =>
        category.key === categoryKey
          ? {
              ...category,
              criteria: category.criteria.map((criterion) =>
                criterion.key === criterionKey
                  ? { ...criterion, ...patch }
                  : criterion,
              ),
            }
          : category,
      ),
    );
  }

  function addCriterion(categoryKey: string) {
    setCategories((prev) =>
      prev.map((category) =>
        category.key === categoryKey
          ? { ...category, criteria: [...category.criteria, newCriterion()] }
          : category,
      ),
    );
  }

  function removeCriterion(categoryKey: string, criterionKey: string) {
    setCategories((prev) =>
      prev.map((category) =>
        category.key === categoryKey
          ? {
              ...category,
              criteria: category.criteria.filter(
                (criterion) => criterion.key !== criterionKey,
              ),
            }
          : category,
      ),
    );
  }

  function addCategory() {
    setCategories((prev) => [...prev, newCategory()]);
  }

  function removeCategory(key: string) {
    setCategories((prev) => prev.filter((category) => category.key !== key));
  }

  function updateAward(key: string, patch: Partial<Award>) {
    setAwards((prev) =>
      prev.map((award) => (award.key === key ? { ...award, ...patch } : award)),
    );
  }

  function addAward() {
    setAwards((prev) => [...prev, newAward(prev.length + 1)]);
  }

  function removeAward(key: string) {
    setAwards((prev) => prev.filter((award) => award.key !== key));
  }

  function validateStep(currentStep: number): string | null {
    if (currentStep === 1) {
      if (!basic.name.trim()) return "Vui lòng nhập tên cuộc thi.";
      if (
        !schedule.registrationStartAt ||
        !schedule.submissionDeadlineAt ||
        !schedule.judgingStartAt ||
        !schedule.judgingDeadlineAt
      ) {
        return "Vui lòng nhập đủ 4 mốc thời gian bắt buộc.";
      }

      const reg = new Date(schedule.registrationStartAt).getTime();
      const sub = new Date(schedule.submissionDeadlineAt).getTime();
      const judgeStart = new Date(schedule.judgingStartAt).getTime();
      const judgeEnd = new Date(schedule.judgingDeadlineAt).getTime();
      const publish = schedule.publishedAt
        ? new Date(schedule.publishedAt).getTime()
        : null;

      if (!(reg < sub && sub < judgeStart && judgeStart < judgeEnd)) {
        return "MSG008: Lịch trình phải theo thứ tự Đăng ký < Nộp bài < Bắt đầu chấm < Kết thúc chấm.";
      }
      if (publish !== null && judgeEnd >= publish) {
        return "MSG008: Thời gian công bố phải sau thời gian kết thúc chấm.";
      }
    }

    if (currentStep === 2) {
      if (categories.length === 0) return "Cần ít nhất một hạng mục.";
      for (const category of categories) {
        if (category.name.trim().length < 3) {
          return "Tên mỗi hạng mục phải có tối thiểu 3 ký tự.";
        }
        if (
          category.maxEntriesPerParticipant < 1 ||
          category.maxEntriesPerParticipant > 10
        ) {
          return "Số bài tối đa mỗi thí sinh phải từ 1 đến 10.";
        }
      }
    }

    if (currentStep === 3) {
      for (const category of categories) {
        const total = weightTotal(category.criteria);
        if (Math.abs(total - 100) >= 0.0001) {
          return `MSG007: Hạng mục "${category.name}" đang có tổng trọng số ${formatWeight(total)}%, cần đúng 100%.`;
        }
        for (const criterion of category.criteria) {
          if (criterion.name.trim().length < 2) {
            return "Tên mỗi tiêu chí phải có tối thiểu 2 ký tự.";
          }
        }
      }
    }

    return null;
  }

  function goNext() {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setStep((prev) => Math.min(prev + 1, STEPS.length));
  }

  function goBack() {
    setError("");
    setStep((prev) => Math.max(prev - 1, 1));
  }

  async function submit(status: "draft" | "open") {
    for (let index = 1; index <= 4; index += 1) {
      const message = validateStep(index);
      if (message) {
        setStep(index);
        setError(message);
        return;
      }
    }

    setIsLoading(true);
    setError("");

    try {
      await http.post("/api/v1/contests", {
        name: basic.name.trim(),
        theme: basic.theme.trim() || null,
        description: basic.description.trim() || null,
        rules: basic.rules.trim() || null,
        coverImageUrl: basic.coverImageUrl.trim() || null,
        registrationStartAt: new Date(
          schedule.registrationStartAt,
        ).toISOString(),
        submissionDeadlineAt: new Date(
          schedule.submissionDeadlineAt,
        ).toISOString(),
        judgingStartAt: new Date(schedule.judgingStartAt).toISOString(),
        judgingDeadlineAt: new Date(schedule.judgingDeadlineAt).toISOString(),
        publishedAt: schedule.publishedAt
          ? new Date(schedule.publishedAt).toISOString()
          : null,
        maxEntriesPerUser: basic.maxEntriesPerUser,
        status,
        categories: categories.map((category) => ({
          name: category.name.trim(),
          description: category.description.trim() || null,
          formatRestriction: category.formatRestriction,
          maxEntriesPerParticipant: category.maxEntriesPerParticipant,
          requireNegativeProofUpfront: category.requireNegativeProofUpfront,
          criteria: category.criteria.map((criterion) => ({
            name: criterion.name.trim(),
            weight: criterion.weightPercent / 100,
            maxScore: criterion.maxScore,
          })),
        })),
        awards: awards
          .filter((award) => award.name.trim())
          .map((award) => ({
            name: award.name.trim(),
            rankOrder: award.rankOrder,
            prizeValueVnd: award.prizeValueVnd,
            quota: award.quota,
          })),
      });

      router.push("/portal/contests");
      router.refresh();
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      setError(
        apiErr.response?.data?.message ??
          apiErr.response?.data?.error ??
          "Tạo cuộc thi thất bại. Vui lòng kiểm tra lại kết nối Backend!",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        href="/portal/contests"
        className="inline-flex items-center text-sm text-gray-500 hover:text-black"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
      </Link>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl">Tạo cuộc thi mới</CardTitle>
            <CardDescription>
              Khởi tạo cuộc thi ảnh phim qua 4 bước: thông tin, hạng mục, tiêu
              chí chấm và giải thưởng.
            </CardDescription>

            <ol className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
              {STEPS.map((item) => {
                const isActive = step === item.id;
                const isDone = step > item.id;
                return (
                  <li
                    key={item.id}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                      isActive
                        ? "border-black bg-black text-white"
                        : isDone
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 text-gray-500"
                    }`}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs">
                      {isDone ? <Check className="h-3 w-3" /> : item.id}
                    </span>
                    <span className="leading-tight">{item.label}</span>
                  </li>
                );
              })}
            </ol>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    1. Thông tin chung
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Tên cuộc thi <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={basic.name}
                      onChange={(e) => updateBasic("name", e.target.value)}
                      placeholder="VD: Cuộc thi Nhiếp ảnh Phim Mùa Thu 2026"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="theme">Chủ đề</Label>
                      <Input
                        id="theme"
                        value={basic.theme}
                        onChange={(e) => updateBasic("theme", e.target.value)}
                        placeholder="VD: Ánh sáng Di sản"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxEntriesPerUser">
                        Tổng số bài tối đa / thí sinh
                      </Label>
                      <Input
                        id="maxEntriesPerUser"
                        type="number"
                        min={1}
                        max={20}
                        value={basic.maxEntriesPerUser}
                        onChange={(e) =>
                          updateBasic(
                            "maxEntriesPerUser",
                            Number(e.target.value),
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Thể lệ & Mô tả</Label>
                    <textarea
                      id="description"
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={basic.description}
                      onChange={(e) =>
                        updateBasic("description", e.target.value)
                      }
                      placeholder="Giới thiệu cuộc thi, mục đích, thể lệ..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rules">Quy chuẩn kỹ thuật</Label>
                    <textarea
                      id="rules"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={basic.rules}
                      onChange={(e) => updateBasic("rules", e.target.value)}
                      placeholder="Yêu cầu về phim, máy, scan, hậu kỳ..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coverImageUrl">URL ảnh banner</Label>
                    <Input
                      id="coverImageUrl"
                      value={basic.coverImageUrl}
                      onChange={(e) =>
                        updateBasic("coverImageUrl", e.target.value)
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    2. Lịch trình (BR-08)
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ScheduleField
                      id="registrationStartAt"
                      label="Bắt đầu đăng ký *"
                      value={schedule.registrationStartAt}
                      onChange={updateSchedule}
                    />
                    <ScheduleField
                      id="submissionDeadlineAt"
                      label="Hạn chót nộp bài *"
                      value={schedule.submissionDeadlineAt}
                      onChange={updateSchedule}
                    />
                    <ScheduleField
                      id="judgingStartAt"
                      label="Bắt đầu chấm *"
                      value={schedule.judgingStartAt}
                      onChange={updateSchedule}
                    />
                    <ScheduleField
                      id="judgingDeadlineAt"
                      label="Kết thúc chấm *"
                      value={schedule.judgingDeadlineAt}
                      onChange={updateSchedule}
                    />
                    <ScheduleField
                      id="publishedAt"
                      label="Công bố kết quả (tùy chọn)"
                      value={schedule.publishedAt}
                      onChange={updateSchedule}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-lg font-semibold">Hạng mục thi</h3>
                  <Button type="button" variant="outline" onClick={addCategory}>
                    <Plus className="w-4 h-4 mr-1" /> Thêm hạng mục
                  </Button>
                </div>

                {categories.map((category, index) => (
                  <div
                    key={category.key}
                    className="space-y-4 rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Hạng mục {index + 1}</h4>
                      {categories.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeCategory(category.key)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Tên hạng mục *</Label>
                      <Input
                        value={category.name}
                        onChange={(e) =>
                          updateCategory(category.key, {
                            name: e.target.value,
                          })
                        }
                        placeholder="VD: Nhiếp ảnh Đường phố 35mm"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Giới hạn khổ phim</Label>
                        <select
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={category.formatRestriction}
                          onChange={(e) =>
                            updateCategory(category.key, {
                              formatRestriction: e.target.value,
                            })
                          }
                        >
                          {FORMAT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Số bài tối đa / thí sinh</Label>
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          value={category.maxEntriesPerParticipant}
                          onChange={(e) =>
                            updateCategory(category.key, {
                              maxEntriesPerParticipant: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>

                    <label
                      htmlFor={`negative-proof-${category.key}`}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        id={`negative-proof-${category.key}`}
                        checked={category.requireNegativeProofUpfront}
                        onCheckedChange={(checked) =>
                          updateCategory(category.key, {
                            requireNegativeProofUpfront: checked === true,
                          })
                        }
                      />
                      Bắt buộc nộp ảnh âm bản ngay từ vòng đăng ký (BR-06)
                    </label>
                  </div>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                {categories.map((category) => {
                  const total = weightTotal(category.criteria);
                  const isExact = Math.abs(total - 100) < 0.0001;
                  const isOver = total > 100;
                  return (
                    <div
                      key={category.key}
                      className="space-y-3 rounded-lg border p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-medium">{category.name}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addCriterion(category.key)}
                        >
                          <Plus className="w-4 h-4 mr-1" /> Thêm tiêu chí
                        </Button>
                      </div>

                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full transition-all ${
                            isExact
                              ? "bg-green-500"
                              : isOver
                                ? "bg-red-500"
                                : "bg-yellow-400"
                          }`}
                          style={{ width: `${Math.min(total, 100)}%` }}
                        />
                      </div>
                      <p
                        className={`text-sm ${
                          isExact
                            ? "text-green-600"
                            : isOver
                              ? "text-red-600"
                              : "text-yellow-600"
                        }`}
                      >
                        {isExact
                          ? "Tổng trọng số: 100% — hợp lệ"
                          : isOver
                            ? `MSG007: Vượt quá 100% (${formatWeight(total)}%)`
                            : `Còn thiếu ${formatWeight(100 - total)}%`}
                      </p>

                      {category.criteria.map((criterion) => (
                        <div
                          key={criterion.key}
                          className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_120px_120px_40px]"
                        >
                          <div className="space-y-1">
                            <Label className="text-xs">Tên tiêu chí</Label>
                            <Input
                              value={criterion.name}
                              onChange={(e) =>
                                updateCriterion(category.key, criterion.key, {
                                  name: e.target.value,
                                })
                              }
                              placeholder="VD: Bố cục & Khoảnh khắc"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Trọng số (%)</Label>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step="0.01"
                              value={criterion.weightPercent}
                              onChange={(e) =>
                                updateCriterion(category.key, criterion.key, {
                                  weightPercent: Number(e.target.value),
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Điểm tối đa</Label>
                            <Input
                              type="number"
                              min={1}
                              max={10}
                              step="0.5"
                              value={criterion.maxScore}
                              onChange={(e) =>
                                updateCriterion(category.key, criterion.key, {
                                  maxScore: Number(e.target.value),
                                })
                              }
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              removeCriterion(category.key, criterion.key)
                            }
                            className="text-red-600"
                            disabled={category.criteria.length <= 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-lg font-semibold">Cơ cấu giải thưởng</h3>
                  <Button type="button" variant="outline" onClick={addAward}>
                    <Plus className="w-4 h-4 mr-1" /> Thêm giải
                  </Button>
                </div>

                {awards.map((award, index) => (
                  <div
                    key={award.key}
                    className="grid grid-cols-1 items-end gap-3 rounded-lg border p-4 md:grid-cols-[1fr_80px_160px_80px_40px]"
                  >
                    <div className="space-y-1">
                      <Label className="text-xs">Tên giải</Label>
                      <Input
                        value={award.name}
                        onChange={(e) =>
                          updateAward(award.key, { name: e.target.value })
                        }
                        placeholder={`VD: Giải ${index === 0 ? "Nhất" : "Khuyến khích"}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Hạng</Label>
                      <Input
                        type="number"
                        min={1}
                        value={award.rankOrder}
                        onChange={(e) =>
                          updateAward(award.key, {
                            rankOrder: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Giá trị (VND)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={award.prizeValueVnd}
                        onChange={(e) =>
                          updateAward(award.key, {
                            prizeValueVnd: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Số lượng</Label>
                      <Input
                        type="number"
                        min={1}
                        value={award.quota}
                        onChange={(e) =>
                          updateAward(award.key, {
                            quota: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeAward(award.key)}
                      className="text-red-600"
                      disabled={awards.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-600">
                  <p className="font-medium text-gray-900">Tổng kết</p>
                  <p>Cuộc thi: {basic.name || "(chưa đặt tên)"}</p>
                  <p>Hạng mục: {categories.length}</p>
                  <p>
                    Tiêu chí:{" "}
                    {categories.reduce(
                      (total, category) => total + category.criteria.length,
                      0,
                    )}
                  </p>
                  <p>
                    Giải thưởng:{" "}
                    {awards.filter((award) => award.name.trim()).length}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
                {error}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-wrap justify-between gap-4 border-t p-6">
            <div className="flex gap-2">
              <Link href="/portal/contests">
                <Button type="button" variant="outline">
                  Hủy
                </Button>
              </Link>
              {step > 1 && (
                <Button type="button" variant="outline" onClick={goBack}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {step < 4 && (
                <Button
                  type="button"
                  className="bg-black text-white gap-2"
                  onClick={goNext}
                  disabled={step === 3 && !weightsValid}
                >
                  Tiếp tục <ArrowRight className="w-4 h-4" />
                </Button>
              )}

              {step === 4 && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => submit("draft")}
                    disabled={isLoading}
                  >
                    <Save className="w-4 h-4 mr-1" /> Lưu bản nháp
                  </Button>
                  <Button
                    type="button"
                    className="bg-black text-white gap-2"
                    onClick={() => submit("open")}
                    disabled={isLoading}
                  >
                    {isLoading ? "Đang lưu..." : "Mở nhận bài ngay"}
                  </Button>
                </>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

function ScheduleField({
  id,
  label,
  value,
  onChange,
}: {
  id: keyof Schedule;
  label: string;
  value: string;
  onChange: (field: keyof Schedule, value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="datetime-local"
        value={value}
        onChange={(event) => onChange(id, event.target.value)}
      />
    </div>
  );
}
