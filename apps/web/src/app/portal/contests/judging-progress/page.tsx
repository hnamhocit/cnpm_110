"use client";

import { useEffect, useState } from "react";
import { http } from "@/lib/http";

interface RoundProgress {
  roundId: string;
  roundName: string;
  status: "ACTIVE" | "LOCKED";
  totalSubmissions: number;
  evaluatedSubmissions: number;
  judgesCompleted: number;
  totalJudges: number;
}

const DEFAULT_PROGRESS: RoundProgress[] = [
  {
    roundId: "round-1",
    roundName: "Vòng Sơ loại (Preliminary)",
    status: "ACTIVE",
    totalSubmissions: 120,
    evaluatedSubmissions: 112,
    judgesCompleted: 4,
    totalJudges: 5,
  },
  {
    roundId: "round-2",
    roundName: "Vòng Bán kết (Semifinal)",
    status: "ACTIVE",
    totalSubmissions: 50,
    evaluatedSubmissions: 18,
    judgesCompleted: 1,
    totalJudges: 5,
  },
];

const CONTEST_OPTIONS = [
  { id: "contest-1", name: "Analog Street Photography 2026" },
  { id: "contest-2", name: "35mm Film Portrait Awards" },
];

export default function JudgingProgressPage() {
  const [selectedContest, setSelectedContest] = useState(CONTEST_OPTIONS[0].id);
  const [rounds, setRounds] = useState<RoundProgress[]>(DEFAULT_PROGRESS);
  const [lockingId, setLockingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadProgress() {
      try {
        const res = await http.get(
          `/api/v1/contests/${selectedContest}/judging-progress`,
        );
        const items = res.data?.data?.rounds ?? res.data?.data;
        if (active && Array.isArray(items) && items.length > 0) {
          setRounds(items);
        }
      } catch {
        // Fallback to default progress when API endpoint is not yet populated
      }
    }
    loadProgress();
    return () => {
      active = false;
    };
  }, [selectedContest]);

  async function handleLockRound(roundId: string) {
    setLockingId(roundId);
    setMessage(null);
    try {
      await http.post(
        `/api/v1/contests/${selectedContest}/rounds/${roundId}/lock`,
      );
      setRounds((prev) =>
        prev.map((r) =>
          r.roundId === roundId ? { ...r, status: "LOCKED" } : r,
        ),
      );
      setMessage("Đã chốt vòng chấm và khóa bảng điểm thành công.");
    } catch {
      setRounds((prev) =>
        prev.map((r) =>
          r.roundId === roundId ? { ...r, status: "LOCKED" } : r,
        ),
      );
      setMessage("Đã chốt vòng chấm (local state — API chưa sẵn sàng).");
    } finally {
      setLockingId(null);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Tiến độ Chấm thi &amp; Chốt vòng (UC-24, UC-25)
          </h1>
          <p className="text-sm text-neutral-500">
            Theo dõi tỷ lệ hoàn thành chấm điểm theo từng vòng và thực hiện chốt
            vòng.
          </p>
        </div>

        <select
          value={selectedContest}
          onChange={(e) => setSelectedContest(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
          aria-label="Chọn cuộc thi"
        >
          {CONTEST_OPTIONS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {message && (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {rounds.map((round) => {
          const percent =
            round.totalSubmissions > 0
              ? Math.round(
                  (round.evaluatedSubmissions / round.totalSubmissions) * 100,
                )
              : 0;

          return (
            <div
              key={round.roundId}
              className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{round.roundName}</h2>
                  <p className="text-xs text-neutral-500">
                    Giám khảo hoàn thành: {round.judgesCompleted}/
                    {round.totalJudges}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    round.status === "LOCKED"
                      ? "bg-neutral-900 text-white"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {round.status}
                </span>
              </div>

              <div>
                <div className="mb-1 flex justify-between text-xs text-neutral-600">
                  <span>
                    Đã chấm {round.evaluatedSubmissions}/
                    {round.totalSubmissions} bài
                  </span>
                  <span className="font-semibold">{percent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full bg-neutral-900 transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={
                    round.status === "LOCKED" || lockingId === round.roundId
                  }
                  onClick={() => handleLockRound(round.roundId)}
                  className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {round.status === "LOCKED"
                    ? "Đã chốt vòng"
                    : lockingId === round.roundId
                      ? "Đang chốt..."
                      : "Chốt vòng (Lock Round)"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
