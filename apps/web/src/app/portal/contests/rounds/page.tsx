"use client";

import { useEffect, useState } from "react";
import { http } from "@/lib/http";

type RoundType = "PRELIMINARY" | "SEMIFINAL" | "FINAL";
type RoundStatus = "DRAFT" | "ACTIVE" | "LOCKED";

interface JudgingRound {
  id: string;
  name: string;
  type: RoundType;
  order: number;
  advanceCount: number;
  status: RoundStatus;
  startDate: string;
  endDate: string;
}

const DEFAULT_ROUNDS: JudgingRound[] = [
  {
    id: "round-1",
    name: "Vòng Sơ loại (Preliminary)",
    type: "PRELIMINARY",
    order: 1,
    advanceCount: 50,
    status: "ACTIVE",
    startDate: "2026-12-01",
    endDate: "2026-12-07",
  },
  {
    id: "round-2",
    name: "Vòng Bán kết (Semifinal)",
    type: "SEMIFINAL",
    order: 2,
    advanceCount: 15,
    status: "DRAFT",
    startDate: "2026-12-08",
    endDate: "2026-12-14",
  },
  {
    id: "round-3",
    name: "Vòng Chung kết (Final)",
    type: "FINAL",
    order: 3,
    advanceCount: 5,
    status: "DRAFT",
    startDate: "2026-12-15",
    endDate: "2026-12-20",
  },
];

const CONTEST_OPTIONS = [
  { id: "contest-1", name: "Analog Street Photography 2026" },
  { id: "contest-2", name: "35mm Film Portrait Awards" },
];

export default function JudgingRoundsPage() {
  const [selectedContest, setSelectedContest] = useState(CONTEST_OPTIONS[0].id);
  const [rounds, setRounds] = useState<JudgingRound[]>(DEFAULT_ROUNDS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form state for adding a new round
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<RoundType>("PRELIMINARY");
  const [newAdvanceCount, setNewAdvanceCount] = useState(20);
  const [newStartDate, setNewStartDate] = useState("2026-12-01");
  const [newEndDate, setNewEndDate] = useState("2026-12-10");

  useEffect(() => {
    let active = true;
    async function loadRounds() {
      try {
        const res = await http.get(
          `/api/v1/contests/${selectedContest}/rounds`,
        );
        const items = res.data?.data?.items ?? res.data?.data;
        if (active && Array.isArray(items) && items.length > 0) {
          setRounds(items);
        }
      } catch {
        // Fallback to default rounds when API endpoint is not yet populated
      }
    }
    loadRounds();
    return () => {
      active = false;
    };
  }, [selectedContest]);

  function handleAddRound(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    const nextRound: JudgingRound = {
      id: `round-${Date.now()}`,
      name: newName.trim(),
      type: newType,
      order: rounds.length + 1,
      advanceCount: Math.max(1, newAdvanceCount),
      status: "DRAFT",
      startDate: newStartDate,
      endDate: newEndDate,
    };

    setRounds((prev) => [...prev, nextRound]);
    setNewName("");
    setMessage("Đã thêm vòng chấm mới vào danh sách (chưa lưu lên server).");
  }

  function handleUpdateAdvance(id: string, value: number) {
    setRounds((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, advanceCount: Math.max(1, value) } : r,
      ),
    );
  }

  function handleRemoveRound(id: string) {
    setRounds((prev) =>
      prev
        .filter((r) => r.id !== id)
        .map((r, idx) => ({ ...r, order: idx + 1 })),
    );
  }

  async function handleSaveRounds() {
    setSaving(true);
    setMessage(null);
    try {
      await http.put(`/api/v1/contests/${selectedContest}/rounds`, { rounds });
      setMessage("Đã lưu cấu hình vòng chấm thành công.");
    } catch {
      setMessage(
        "Đã cập nhật cấu hình vòng chấm (local state — API chưa sẵn sàng).",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Cấu hình Vòng chấm (UC-15)
          </h1>
          <p className="text-sm text-neutral-500">
            Thiết lập các vòng Sơ loại, Bán kết, Chung kết và số lượng tác phẩm
            đi tiếp.
          </p>
        </div>

        <div className="flex items-center gap-3">
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

          <button
            type="button"
            onClick={handleSaveRounds}
            disabled={saving}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Lưu cấu hình"}
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800">
          {message}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Thứ tự</th>
              <th className="px-4 py-3">Tên vòng</th>
              <th className="px-4 py-3">Loại vòng</th>
              <th className="px-4 py-3">Số bài đi tiếp</th>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {rounds.map((round) => (
              <tr key={round.id}>
                <td className="px-4 py-3 font-medium">#{round.order}</td>
                <td className="px-4 py-3 font-medium">{round.name}</td>
                <td className="px-4 py-3">{round.type}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={1}
                    value={round.advanceCount}
                    onChange={(e) =>
                      handleUpdateAdvance(round.id, Number(e.target.value))
                    }
                    className="w-20 rounded border border-neutral-300 px-2 py-1 text-sm"
                    aria-label={`Số bài đi tiếp cho ${round.name}`}
                  />
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {round.startDate} → {round.endDate}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                    {round.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveRound(round.id)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        onSubmit={handleAddRound}
        className="grid grid-cols-1 gap-4 rounded-lg border border-neutral-200 bg-white p-4 md:grid-cols-6"
      >
        <input
          type="text"
          placeholder="Tên vòng chấm mới..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm md:col-span-2"
          required
        />
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as RoundType)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          aria-label="Loại vòng chấm"
        >
          <option value="PRELIMINARY">PRELIMINARY (Sơ loại)</option>
          <option value="SEMIFINAL">SEMIFINAL (Bán kết)</option>
          <option value="FINAL">FINAL (Chung kết)</option>
        </select>
        <input
          type="number"
          min={1}
          value={newAdvanceCount}
          onChange={(e) => setNewAdvanceCount(Number(e.target.value))}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          placeholder="Số bài đi tiếp"
        />
        <input
          type="date"
          value={newStartDate}
          onChange={(e) => setNewStartDate(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          aria-label="Ngày bắt đầu"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={newEndDate}
            onChange={(e) => setNewEndDate(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            aria-label="Ngày kết thúc"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Thêm
          </button>
        </div>
      </form>
    </div>
  );
}
