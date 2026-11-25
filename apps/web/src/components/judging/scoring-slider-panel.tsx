"use client";

import { useMemo } from "react";
import { CheckCircle2, MessageSquare, ShieldAlert, Sparkles } from "lucide-react";
import type { ScorecardInput, ScoringCriterion } from "@/types/judging";
import {
  calculateWeightedTotalScore,
  validateScorecardCompletion,
} from "@/lib/judging-utils";
import { Button } from "@/components/ui/button";

interface ScoringSliderPanelProps {
  criteria: ScoringCriterion[];
  value: ScorecardInput;
  onChange: (newValue: ScorecardInput) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function ScoringSliderPanel({
  criteria,
  value,
  onChange,
  onSubmit,
  isSubmitting = false,
}: ScoringSliderPanelProps) {
  const { totalScore, maxPossibleScore, percentage } = useMemo(() => {
    return calculateWeightedTotalScore(criteria, value.scores);
  }, [criteria, value.scores]);

  const { isValid, commentError, missingCriteriaNames } = useMemo(() => {
    return validateScorecardCompletion(criteria, value.scores, value.comments);
  }, [criteria, value.scores, value.comments]);

  const handleScoreChange = (criterionId: string, score: number) => {
    onChange({
      ...value,
      scores: {
        ...value.scores,
        [criterionId]: score,
      },
    });
  };

  return (
    <div className="w-full lg:w-[400px] xl:w-[450px] bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden">
      {/* Panel Header & Live Score Result */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            Phiếu Đánh Giá
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Chấm điểm tiêu chí
          </h3>
        </div>

        <div className="text-right">
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400">
            {totalScore}{" "}
            <span className="text-xs font-normal text-slate-400">
              / {maxPossibleScore}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            (Đạt {percentage}%)
          </span>
        </div>
      </div>

      {/* Criteria Sliders List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {criteria.map((criterion) => {
          const currentScore = value.scores[criterion.id] ?? 0;
          return (
            <div key={criterion.id} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {criterion.name}
                  </span>
                  <span className="ml-1.5 text-[10px] text-sky-600 font-mono font-medium">
                    (Trọng số: {criterion.weight}%)
                  </span>
                </div>
                <span className="font-bold text-sm text-sky-600 font-mono">
                  {currentScore} / {criterion.maxScore}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 leading-tight">
                {criterion.description}
              </p>

              {/* Range Slider */}
              <div className="relative pt-1">
                <input
                  type="range"
                  min="0"
                  max={criterion.maxScore}
                  step="0.5"
                  value={currentScore}
                  onChange={(e) =>
                    handleScoreChange(criterion.id, Number.parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono px-0.5 mt-1">
                  <span>0</span>
                  <span>{criterion.maxScore / 2}</span>
                  <span>{criterion.maxScore}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Khung Nhập Nhận Xét Chuyên Môn */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
              Nhận xét chuyên môn (Bắt buộc)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {value.comments.trim().length} ký tự (tối thiểu 10)
            </span>
          </label>
          <textarea
            rows={4}
            value={value.comments}
            onChange={(e) => onChange({ ...value, comments: e.target.value })}
            placeholder="Ghi nhận xét về bố cục, màu sắc, kỹ thuật tráng rọi hoặc cảm xúc tác phẩm..."
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all resize-none"
          />
          {commentError && (
            <p className="text-[11px] text-rose-500">{commentError}</p>
          )}
        </div>
      </div>

      {/* Submission Action Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
          className="w-full h-11 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow-md shadow-sky-600/20 disabled:opacity-50 transition-all"
        >
          {isSubmitting ? (
            "Đang gửi điểm..."
          ) : (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Xác nhận và Nộp phiếu chấm
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

