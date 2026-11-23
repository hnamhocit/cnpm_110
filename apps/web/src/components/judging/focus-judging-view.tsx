"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Maximize,
  Minimize,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import type {
  BlindEvaluationSubmission,
  ScorecardInput,
  ScoringCriterion,
} from "@/types/judging";
import { HighResZoomViewer } from "@/components/judging/high-res-zoom-viewer";
import { ScoringSliderPanel } from "@/components/judging/scoring-slider-panel";

interface FocusJudgingViewProps {
  submission: BlindEvaluationSubmission;
  criteria: ScoringCriterion[];
}

export function FocusJudgingView({
  submission,
  criteria,
}: FocusJudgingViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMetadataSidebar, setShowMetadataSidebar] = useState(true);

  const [scorecard, setScorecard] = useState<ScorecardInput>({
    scores: {
      "crit-1": 8,
      "crit-2": 8.5,
      "crit-3": 9,
    },
    comments: "",
  });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSubmitScore = () => {
    toast.info("Phiếu chấm thử chưa được lưu vào hệ thống.");
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-white">
      {/* Top Header Bar (Focus Mode Bar) */}
      <header className="h-14 px-4 bg-slate-900 border-b border-white/10 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/portal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Thoát chế độ chấm bài"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-sky-800/60">
                {submission.anonymousCode}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300 font-medium line-clamp-1">
                {submission.title}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {submission.contestName} | {submission.categoryName} ({submission.roundName})
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono border border-white/5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Blind Judging Active</span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình (Focus Mode)"}
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5" />
            ) : (
              <Maximize className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Deep Grain Image Viewer + Metadata */}
        <HighResZoomViewer
          submission={submission}
          showMetadataSidebar={showMetadataSidebar}
          onToggleSidebar={() => setShowMetadataSidebar(!showMetadataSidebar)}
        />

        {/* Scoring Slider Panel */}
        <ScoringSliderPanel
          criteria={criteria}
          value={scorecard}
          onChange={setScorecard}
          onSubmit={handleSubmitScore}
          isSubmitting={false}
        />
      </div>
    </div>
  );
}

