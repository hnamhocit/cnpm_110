"use client";

import { useEffect, useMemo, useState } from "react";
import { http } from "@/lib/http";

interface JudgeSubmission {
  id: string;
  code: string;
  categoryName: string;
  filmStock: string;
  camera: string;
  lens: string;
  imageUrl: string;
  status: "PENDING" | "DRAFT" | "SUBMITTED" | "LOCKED";
  scores: {
    composition: number;
    technique: number;
    storytelling: number;
  };
  comment: string;
}

const DEFAULT_SUBMISSIONS: JudgeSubmission[] = [
  {
    id: "sub-1",
    code: "ANL-2026-0041",
    categoryName: "Street 35mm",
    filmStock: "Kodak Tri-X 400",
    camera: "Leica M6",
    lens: "Summicron 35mm f/2",
    imageUrl: "/placeholder-film-1.jpg",
    status: "PENDING",
    scores: { composition: 8, technique: 8, storytelling: 9 },
    comment: "",
  },
  {
    id: "sub-2",
    code: "ANL-2026-0042",
    categoryName: "Portrait Medium Format",
    filmStock: "Kodak Portra 400",
    camera: "Hasselblad 500C/M",
    lens: "Planar 80mm f/2.8",
    imageUrl: "/placeholder-film-2.jpg",
    status: "DRAFT",
    scores: { composition: 9, technique: 8, storytelling: 8 },
    comment: "Ánh sáng tự nhiên tốt, giữ chi tiết vùng tối.",
  },
];

export default function JudgeWorkspacePage() {
  const [submissions, setSubmissions] =
    useState<JudgeSubmission[]>(DEFAULT_SUBMISSIONS);
  const [selectedId, setSelectedId] = useState<string>(
    DEFAULT_SUBMISSIONS[0].id,
  );
  const [zoom, setZoom] = useState<number>(100);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadAssignments() {
      try {
        const res = await http.get("/api/v1/judge/assignments");
        const items = res.data?.data?.items ?? res.data?.data;
        if (active && Array.isArray(items) && items.length > 0) {
          setSubmissions(items);
          setSelectedId(items[0].id);
        }
      } catch {
        // Fallback to default submissions when API endpoint is not yet populated
      }
    }
    loadAssignments();
    return () => {
      active = false;
    };
  }, []);

  const current = useMemo(
    () => submissions.find((s) => s.id === selectedId) ?? submissions[0],
    [submissions, selectedId],
  );

  const isLocked = current?.status === "LOCKED";

  function updateScore(key: keyof JudgeSubmission["scores"], value: number) {
    if (!current || isLocked) return;
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === current.id
          ? { ...s, scores: { ...s.scores, [key]: value } }
          : s,
      ),
    );
  }

  function updateComment(value: string) {
    if (!current || isLocked) return;
    setSubmissions((prev) =>
      prev.map((s) => (s.id === current.id ? { ...s, comment: value } : s)),
    );
  }

  async function handleSaveEvaluation(
    nextStatus: "DRAFT" | "SUBMITTED" | "LOCKED",
  ) {
    if (!current) return;
    setSaving(true);
    setMessage(null);
    try {
      await http.post("/api/v1/judge/evaluations", {
        submissionId: current.id,
        scores: current.scores,
        comment: current.comment,
        status: nextStatus,
      });
      if (nextStatus === "LOCKED") {
        await http.post(`/api/v1/judge/evaluations/${current.id}/lock`);
      }
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === current.id ? { ...s, status: nextStatus } : s,
        ),
      );
      setMessage(
        nextStatus === "LOCKED"
          ? `Đã khóa phiếu chấm cho ${current.code}.`
          : `Đã lưu phiếu chấm (${nextStatus}) cho ${current.code}.`,
      );
    } catch {
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === current.id ? { ...s, status: nextStatus } : s,
        ),
      );
      setMessage(
        `Đã cập nhật phiếu chấm ${current.code} (${nextStatus}, local state).`,
      );
    } finally {
      setSaving(false);
    }
  }

  if (!current) return null;

  const totalScore = (
    current.scores.composition * 0.35 +
    current.scores.technique * 0.35 +
    current.scores.storytelling * 0.3
  ).toFixed(2);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100 lg:flex-row">
      {/* Left: Assigned Submissions List (UC-29) */}
      <aside className="w-full border-b border-neutral-800 p-4 lg:w-72 lg:border-r lg:border-b-0">
        <h1 className="text-base font-bold">Judge Workspace (UC-29–33)</h1>
        <p className="mb-4 text-xs text-neutral-400">
          Danh sách bài được phân công (ẩn danh)
        </p>

        <div className="space-y-2">
          {submissions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`w-full rounded-md border p-3 text-left text-sm transition ${
                item.id === current.id
                  ? "border-amber-400 bg-neutral-900"
                  : "border-neutral-800 bg-neutral-950 hover:bg-neutral-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{item.code}</span>
                <span className="rounded bg-neutral-800 px-2 py-0.5 text-[11px]">
                  {item.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                {item.categoryName}
              </p>
            </button>
          ))}
        </div>
      </aside>

      {/* Center: High-res Viewer + Metadata (UC-30) */}
      <main className="flex flex-1 flex-col justify-between p-6">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <h2 className="text-lg font-semibold">{current.code}</h2>
            <p className="text-xs text-neutral-400">
              {current.filmStock} · {current.camera} · {current.lens}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[100, 150, 200].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setZoom(level)}
                className={`rounded px-2.5 py-1 text-xs font-medium ${
                  zoom === level
                    ? "bg-amber-400 text-neutral-950"
                    : "bg-neutral-800 text-neutral-200"
                }`}
              >
                {level}%
              </button>
            ))}
          </div>
        </div>

        <div className="my-4 flex flex-1 items-center justify-center overflow-auto rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <div
            className="flex aspect-[3/2] w-full max-w-2xl items-center justify-center rounded border border-neutral-700 bg-neutral-950 text-sm text-neutral-400 transition-transform"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            Preview ảnh độ phân giải cao ({current.code} · Zoom {zoom}%)
          </div>
        </div>
      </main>

      {/* Right: Scoring Sliders + Submit/Edit/Lock (UC-31–33) */}
      <aside className="w-full border-t border-neutral-800 p-5 lg:w-80 lg:border-t-0 lg:border-l">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Phiếu chấm điểm</h3>
          <span className="text-lg font-bold text-amber-400">
            {totalScore} / 10
          </span>
        </div>

        {message && (
          <div className="mb-4 rounded border border-neutral-700 bg-neutral-900 p-2.5 text-xs text-neutral-200">
            {message}
          </div>
        )}

        <div className="space-y-4">
          {(
            [
              ["composition", "Bố cục (35%)"],
              ["technique", "Kỹ thuật phim (35%)"],
              ["storytelling", "Câu chuyện (30%)"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <div className="mb-1 flex justify-between text-xs">
                <span>{label}</span>
                <span className="font-semibold">{current.scores[key]}</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                disabled={isLocked}
                value={current.scores[key]}
                onChange={(e) => updateScore(key, Number(e.target.value))}
                className="w-full accent-amber-400"
                aria-label={label}
              />
            </div>
          ))}

          <div>
            <label
              htmlFor="judge-comment"
              className="mb-1 block text-xs text-neutral-300"
            >
              Nhận xét chuyên môn
            </label>
            <textarea
              id="judge-comment"
              rows={4}
              disabled={isLocked}
              value={current.comment}
              onChange={(e) => updateComment(e.target.value)}
              placeholder="Nhập nhận xét cho tác phẩm..."
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 p-2.5 text-sm text-neutral-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 pt-2">
            <button
              type="button"
              disabled={saving || isLocked}
              onClick={() => handleSaveEvaluation("DRAFT")}
              className="rounded-md border border-neutral-700 bg-neutral-900 py-2 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
            >
              Lưu nháp
            </button>
            <button
              type="button"
              disabled={saving || isLocked}
              onClick={() => handleSaveEvaluation("SUBMITTED")}
              className="rounded-md bg-amber-400 py-2 text-sm font-semibold text-neutral-950 hover:bg-amber-300 disabled:opacity-50"
            >
              Gửi / Cập nhật phiếu
            </button>
            <button
              type="button"
              disabled={saving || isLocked}
              onClick={() => handleSaveEvaluation("LOCKED")}
              className="rounded-md bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
            >
              {isLocked ? "Đã khóa phiếu" : "Khóa phiếu chấm"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
