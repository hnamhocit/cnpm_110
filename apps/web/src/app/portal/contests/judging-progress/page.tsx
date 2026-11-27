"use client";

import { useCallback, useEffect, useState } from "react";
import { http } from "@/lib/http";

interface RoundProgress {
  roundId: string;
  roundName: string;
  status: "ACTIVE" | "LOCKED";
  totalAssignments: number;
  scoredAssignments: number;
  judgesCompleted: number;
  totalJudges: number;
}

interface ContestOption {
  id: string;
  name: string;
}

interface ContestListItem {
  id: string;
  name: string;
  code?: string | null;
}

interface ProgressPayload {
  round?: {
    id: string;
    name: string;
    lockedAt?: string | null;
  } | null;
  judges?: { isLocked: boolean }[];
  overall?: {
    totalAssigned?: number;
    totalScored?: number;
  };
}

function getErrorMessage(error: unknown): string {
  const fallback = "Đã xảy ra lỗi. Vui lòng thử lại.";
  if (typeof error !== "object" || error === null) return fallback;
  const data = (
    error as {
      response?: { data?: { code?: string; message?: unknown } };
    }
  ).response?.data;
  if (data?.code === "alreadyLocked") {
    return "Vòng chấm này đã được chốt trước đó.";
  }
  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }
  return fallback;
}

function toProgressCards(payload: ProgressPayload | undefined): RoundProgress[] {
  const round = payload?.round;
  if (!round) return [];
  const judges = payload?.judges ?? [];
  const overall = payload?.overall;
  return [
    {
      roundId: round.id,
      roundName: round.name,
      status: round.lockedAt ? "LOCKED" : "ACTIVE",
      totalAssignments: overall?.totalAssigned ?? 0,
      scoredAssignments: overall?.totalScored ?? 0,
      judgesCompleted: judges.filter((judge) => judge.isLocked).length,
      totalJudges: judges.length,
    },
  ];
}

export default function JudgingProgressPage() {
  const [contestOptions, setContestOptions] = useState<ContestOption[]>([]);
  const [selectedContest, setSelectedContest] = useState("");
  const [rounds, setRounds] = useState<RoundProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [lockingId, setLockingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadProgress = useCallback(async (contestId: string) => {
    setLoading(true);
    try {
      const res = await http.get<{ data?: ProgressPayload }>(
        `/api/v1/contests/${contestId}/judging-progress`,
      );
      setRounds(toProgressCards(res.data?.data));
      return true;
    } catch (error) {
      setRounds([]);
      setMessage(`Không thể tải tiến độ chấm: ${getErrorMessage(error)}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadContests() {
      try {
        const res = await http.get<{
          data?: { items?: ContestListItem[] };
        }>("/api/v1/contests", { params: { page: 1, limit: 100 } });
        const items = res.data?.data?.items ?? [];
        const options = items.map((item) => ({
          id: item.id,
          name: item.code ? `${item.name} (${item.code})` : item.name,
        }));
        if (!active) return;
        setContestOptions(options);
        setSelectedContest((current) => current || options[0]?.id || "");
        if (options.length === 0) setLoading(false);
      } catch (error) {
        if (!active) return;
        setMessage(`Không thể tải danh sách cuộc thi: ${getErrorMessage(error)}`);
        setLoading(false);
      }
    }

    void loadContests();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedContest) return;
    void loadProgress(selectedContest);
  }, [selectedContest, loadProgress]);

  async function handleLockRound(roundId: string) {
    setLockingId(roundId);
    setMessage(null);
    try {
      const res = await http.post<{
        data?: { alreadyLocked?: boolean };
      }>(
        `/api/v1/contests/${selectedContest}/close-judging`,
        undefined,
        { params: { roundId } },
      );
      const refreshed = await loadProgress(selectedContest);
      if (refreshed) {
        setMessage(
          res.data?.data?.alreadyLocked === true
            ? "Vòng chấm này đã được chốt trước đó."
            : "Đã chốt vòng chấm và khóa bảng điểm thành công.",
        );
      }
    } catch (error) {
      setMessage(getErrorMessage(error));
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
          {contestOptions.map((contest) => (
            <option key={contest.id} value={contest.id}>
              {contest.name}
            </option>
          ))}
        </select>
      </div>

      {message && (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800">
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Đang tải dữ liệu...</p>
      ) : rounds.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Không có vòng chấm nào để hiển thị.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {rounds.map((round) => {
            const percent =
              round.totalAssignments > 0
                ? Math.round(
                    (round.scoredAssignments / round.totalAssignments) * 100,
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
                      Đã chấm {round.scoredAssignments}/
                      {round.totalAssignments} phiếu
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
      )}
    </div>
  );
}
