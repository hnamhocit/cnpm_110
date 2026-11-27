"use client";

import { useEffect, useState } from "react";
import { http } from "@/lib/http";

interface ContestOption {
  id: string;
  name: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface RoundOption {
  id: string;
  name: string;
}

interface AssignedJudge {
  id: string;
  judgeId: string;
  judgeName?: string;
  judgeEmail?: string;
  categoryId: string;
  categoryName?: string;
  roundId: string;
  status?: string;
}

export default function ContestJudgesPage() {
  const [contests, setContests] = useState<ContestOption[]>([]);
  const [selectedContest, setSelectedContest] = useState<string>("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [rounds, setRounds] = useState<RoundOption[]>([]);
  const [selectedRound, setSelectedRound] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [judgeIdInput, setJudgeIdInput] = useState<string>("");
  const [assignedJudges, setAssignedJudges] = useState<AssignedJudge[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadContests() {
      try {
        const res = await http.get("/api/v1/contests");
        const items = res.data?.data?.items ?? res.data?.data ?? [];
        if (active && Array.isArray(items) && items.length > 0) {
          setContests(items);
          setSelectedContest(items[0].id);
        }
      } catch {
        // Keep empty state if API is unavailable
      }
    }
    loadContests();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedContest) return;
    let active = true;
    async function loadContestMeta() {
      try {
        const [catRes, roundRes] = await Promise.all([
          http.get(`/api/v1/contests/${selectedContest}/categories`),
          http.get(`/api/v1/contests/${selectedContest}/rounds`),
        ]);
        const catItems = catRes.data?.data?.items ?? catRes.data?.data ?? [];
        const roundItems =
          roundRes.data?.data?.items ?? roundRes.data?.data ?? [];
        if (!active) return;
        setCategories(Array.isArray(catItems) ? catItems : []);
        setRounds(Array.isArray(roundItems) ? roundItems : []);
        if (Array.isArray(catItems) && catItems.length > 0) {
          setSelectedCategory(catItems[0].id);
        } else {
          setSelectedCategory("");
        }
        if (Array.isArray(roundItems) && roundItems.length > 0) {
          setSelectedRound(roundItems[0].id);
        } else {
          setSelectedRound("");
        }
      } catch {
        if (active) {
          setCategories([]);
          setRounds([]);
        }
      }
    }
    loadContestMeta();
    return () => {
      active = false;
    };
  }, [selectedContest]);

  useEffect(() => {
    if (!selectedContest || !selectedRound) {
      setAssignedJudges([]);
      return;
    }
    let active = true;
    async function loadRoundJudges() {
      try {
        const res = await http.get(
          `/api/v1/contests/${selectedContest}/rounds/${selectedRound}/judges`,
        );
        const items = res.data?.data?.items ?? res.data?.data ?? [];
        if (active) {
          setAssignedJudges(Array.isArray(items) ? items : []);
        }
      } catch {
        if (active) setAssignedJudges([]);
      }
    }
    loadRoundJudges();
    return () => {
      active = false;
    };
  }, [selectedContest, selectedRound]);

  async function handleAssignJudge(e: React.FormEvent) {
    e.preventDefault();
    if (
      !selectedContest ||
      !selectedRound ||
      !selectedCategory ||
      !judgeIdInput.trim()
    ) {
      setError(
        "Vui lòng chọn đầy đủ Cuộc thi, Vòng chấm, Hạng mục và nhập Judge ID.",
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await http.post(`/api/v1/contests/${selectedContest}/judges`, {
        roundId: selectedRound,
        categoryId: selectedCategory,
        judgeId: judgeIdInput.trim(),
      });
      setMessage("Phân công Giám khảo theo vòng và hạng mục thành công.");
      setJudgeIdInput("");
      const res = await http.get(
        `/api/v1/contests/${selectedContest}/rounds/${selectedRound}/judges`,
      );
      const items = res.data?.data?.items ?? res.data?.data ?? [];
      setAssignedJudges(Array.isArray(items) ? items : []);
    } catch (err: unknown) {
      const apiMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
        "Không thể phân công Giám khảo. Kiểm tra lại Judge ID hoặc quyền.";
      setError(apiMsg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Phân công Giám khảo theo Vòng &amp; Hạng mục (UC-16)
          </h1>
          <p className="text-sm text-neutral-500">
            Phân công tài khoản Judge vào từng vòng chấm và hạng mục (BR-20,
            BR-21).
          </p>
        </div>

        <select
          value={selectedContest}
          onChange={(e) => setSelectedContest(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
          aria-label="Chọn cuộc thi"
        >
          {contests.length === 0 ? (
            <option value="">Chưa có cuộc thi</option>
          ) : (
            contests.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))
          )}
        </select>
      </div>

      {message && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleAssignJudge}
        className="grid grid-cols-1 gap-4 rounded-lg border border-neutral-200 bg-white p-4 md:grid-cols-4"
      >
        <select
          value={selectedRound}
          onChange={(e) => setSelectedRound(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
          aria-label="Chọn vòng chấm"
        >
          {rounds.length === 0 ? (
            <option value="">Chưa có vòng chấm</option>
          ) : (
            rounds.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))
          )}
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
          aria-label="Chọn hạng mục"
        >
          {categories.length === 0 ? (
            <option value="">Chưa có hạng mục</option>
          ) : (
            categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))
          )}
        </select>

        <input
          type="text"
          value={judgeIdInput}
          onChange={(e) => setJudgeIdInput(e.target.value)}
          placeholder="Nhập Judge ID..."
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {submitting ? "Đang phân công..." : "Phân công Giám khảo"}
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Judge ID</th>
              <th className="px-4 py-3">Giám khảo</th>
              <th className="px-4 py-3">Hạng mục</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {assignedJudges.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-mono text-xs">{item.judgeId}</td>
                <td className="px-4 py-3 font-medium">
                  {item.judgeName ?? item.judgeEmail ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {item.categoryName ?? item.categoryId}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                    {item.status ?? "ASSIGNED"}
                  </span>
                </td>
              </tr>
            ))}
            {assignedJudges.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-neutral-500"
                >
                  Chưa có giám khảo nào được phân công cho vòng này.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
