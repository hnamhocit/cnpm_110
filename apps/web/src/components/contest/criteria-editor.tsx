"use client";

import { Minus, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  criteriaErrorForTotal,
  MSG007_INVALID_TOTAL,
} from "@/lib/contest-config-validation";
import {
  type CriterionConfig,
  DEFAULT_MAX_SCORE,
  fromPercent,
  round4,
  toPercent,
} from "@/types/contest-config";

export function criteriaTotal(criteria: CriterionConfig[]): number {
  return round4(
    criteria.reduce(
      (sum, criterion) => sum + (Number(criterion?.weight) || 0),
      0,
    ),
  );
}

type CriteriaEditorProps = {
  criteria: CriterionConfig[];
  onChange: (criteria: CriterionConfig[]) => void;
  error?: string;
  compact?: boolean;
};

export function CriteriaEditor({
  criteria,
  onChange,
  error,
  compact = false,
}: CriteriaEditorProps) {
  const total = criteriaTotal(criteria);
  const totalPercent = toPercent(total);
  const totalError = criteriaErrorForTotal(total);
  const isComplete = totalError === null;
  const isOver = total > 1;

  const update = (index: number, patch: Partial<CriterionConfig>) => {
    onChange(
      criteria.map((criterion, current) =>
        current === index ? { ...criterion, ...patch } : criterion,
      ),
    );
  };

  const add = () => {
    onChange([
      ...criteria,
      {
        code: `CRIT-${Date.now()}`,
        name: "",
        weight: 0,
        maxScore: DEFAULT_MAX_SCORE,
      },
    ]);
  };

  const remove = (index: number) => {
    onChange(criteria.filter((_, current) => current !== index));
  };

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {criteria.map((criterion, index) => (
        <div
          key={`${criterion.code || "criterion"}-${index}`}
          className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-[1fr_7rem_2.5rem]"
        >
          <div className="space-y-1.5">
            <Label htmlFor={`criterion-name-${index}`}>
              Tên tiêu chí {index + 1}
            </Label>
            <Input
              id={`criterion-name-${index}`}
              value={criterion.name}
              placeholder="VD: Bố cục & Ánh sáng"
              onChange={(event) => update(index, { name: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`criterion-weight-${index}`}>Trọng số (%)</Label>
            <Input
              id={`criterion-weight-${index}`}
              type="number"
              min={1}
              max={100}
              step={0.01}
              value={toPercent(criterion.weight) || ""}
              onChange={(event) =>
                update(index, {
                  weight: fromPercent(Number(event.target.value)),
                })
              }
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              aria-label={`Xóa tiêu chí ${index + 1}`}
              onClick={() => remove(index)}
              disabled={criteria.length <= 1}
            >
              <Minus />
            </Button>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={add}
        className="w-full border-dashed"
      >
        <Plus /> Thêm tiêu chí
      </Button>

      <div className="space-y-2 rounded-lg border p-3">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-medium">Tổng trọng số hiện tại</span>
          <Badge
            variant={
              isComplete ? "valid" : isOver ? "disqualified" : "ai-warning"
            }
          >
            {round4(totalPercent)}%
          </Badge>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${
              isComplete
                ? "bg-emerald-500"
                : isOver
                  ? "bg-red-500"
                  : "bg-amber-400"
            }`}
            style={{ width: `${Math.min(totalPercent, 100)}%` }}
          />
        </div>
        <p
          className={`text-xs ${
            isComplete
              ? "text-emerald-600"
              : isOver
                ? "text-red-600 font-medium"
                : "text-amber-600"
          }`}
        >
          {isComplete
            ? "Tổng trọng số đạt 100% (BR-15)."
            : isOver
              ? MSG007_INVALID_TOTAL(totalPercent)
              : `Còn thiếu ${round4(100 - totalPercent)}%. Tổng trọng số phải bằng 100% (BR-15).`}
        </p>
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      </div>
    </div>
  );
}
