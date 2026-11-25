"use client";

import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
import type { MySubmissionStatus } from "@/types/my-submission";

const PIPELINE_STEPS = [
  { key: "submitted", label: "Đã nộp" },
  { key: "ai", label: "AI quét" },
  { key: "proof", label: "Chờ âm bản" },
  { key: "judging", label: "Chấm điểm" },
  { key: "result", label: "Kết quả" },
] as const;

function getStepIndex(status: MySubmissionStatus): {
  activeIndex: number;
  isRejected: boolean;
} {
  const normalized = status.toUpperCase();
  if (normalized === "REJECTED" || normalized === "DISQUALIFIED") {
    return { activeIndex: 4, isRejected: true };
  }
  if (normalized === "JUDGING") {
    return { activeIndex: 3, isRejected: false };
  }
  if (normalized === "APPROVED") {
    return { activeIndex: 3, isRejected: false };
  }
  if (normalized === "PROOF_REQUESTED") {
    return { activeIndex: 2, isRejected: false };
  }
  if (normalized === "AI_VERIFIED" || normalized === "AI_FLAGGED") {
    return { activeIndex: 1, isRejected: false };
  }
  return { activeIndex: 0, isRejected: false };
}

export function ModerationPipelineTimeline({
  status,
}: {
  status: MySubmissionStatus;
}) {
  const { activeIndex, isRejected } = getStepIndex(status);

  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="flex min-w-[460px] items-center justify-between gap-2">
        {PIPELINE_STEPS.map((step, idx) => {
          const isDone = idx < activeIndex && !isRejected;
          const isCurrent = idx === activeIndex;
          const isFailedStep = isRejected && idx === activeIndex;

          return (
            <div key={step.key} className="flex flex-1 items-center gap-2">
              <div className="flex flex-col items-center gap-1 text-center">
                {isFailedStep ? (
                  <XCircle className="h-5 w-5 text-red-600" />
                ) : isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : isCurrent ? (
                  <Clock className="h-5 w-5 text-blue-600" />
                ) : (
                  <Circle className="h-5 w-5 text-slate-300" />
                )}
                <span
                  className={`text-[11px] font-medium whitespace-nowrap ${
                    isFailedStep
                      ? "text-red-700"
                      : isDone
                        ? "text-emerald-700"
                        : isCurrent
                          ? "text-blue-700 font-semibold"
                          : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < PIPELINE_STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 rounded ${
                    isDone ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

