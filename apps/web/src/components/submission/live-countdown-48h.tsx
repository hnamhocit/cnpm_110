"use client";

import { AlertTriangle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { formatRemainingTime } from "@/types/my-submission";

type LiveCountdown48hProps = {
  proofDeadline?: string | null;
};

export function LiveCountdown48h({ proofDeadline }: LiveCountdown48hProps) {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!proofDeadline) {
    return null;
  }

  const state =
    nowMs === null
      ? { expired: false, isUrgent: false, formatted: "--:--:--" }
      : formatRemainingTime(proofDeadline, nowMs);

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
        state.expired
          ? "border-red-300 bg-red-50 text-red-700"
          : state.isUrgent
            ? "border-amber-300 bg-amber-50 text-amber-800"
            : "border-blue-200 bg-blue-50 text-blue-800"
      }`}
    >
      {state.isUrgent || state.expired ? (
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <Clock className="h-3.5 w-3.5 shrink-0" />
      )}
      <span>
        {state.expired
          ? "Đã hết hạn nộp bằng chứng"
          : `Hạn nộp âm bản (BR-19): ${state.formatted}`}
      </span>
    </div>
  );
}

