"use client";

import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { http } from "@/lib/http";

type JudgingRound = {
  key: string;
  name: string;
  advanceCount: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
};

const DEFAULT_ROUNDS: Array<Omit<JudgingRound, "key">> = [
  {
    name: "Vòng Sơ loại",
    advanceCount: 30,
    startAt: "",
    endAt: "",
    isActive: true,
  },
  {
    name: "Vòng Bán kết",
    advanceCount: 10,
    startAt: "",
    endAt: "",
    isActive: true,
  },
  {
    name: "Vòng Chung kết",
    advanceCount: 3,
    startAt: "",
    endAt: "",
    isActive: true,
  },
];

function newRound(index: number): JudgingRound {
  return {
    key: crypto.randomUUID(),
    name: `Vòng ${index + 1}`,
    advanceCount: 1,
    startAt: "",
    endAt: "",
    isActive: true,
  };
}

function RoundsConfigContent() {
  const searchParams = useSearchParams();
  const contestId =
    searchParams.get("contestId") ?? searchParams.get("id") ?? "";
  const contestIdField = useId();

  const [rounds, setRounds] = useState<JudgingRound[]>(() =>
    DEFAULT_ROUNDS.map((round) => ({
      ...round,
      key: crypto.randomUUID(),
    })),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function updateRound(key: string, patch: Partial<JudgingRound>) {
    setRounds((prev) =>
      prev.map((round) => (round.key === key ? { ...round, ...patch } : round)),
    );
  }

  function addRound() {
    setRounds((prev) => [...prev, newRound(prev.length)]);
  }

  function removeRound(key: string) {
    setRounds((prev) => prev.filter((round) => round.key !== key));
  }

  async function handleSave() {
    setError("");
    setNotice("");

    if (!contestId.trim()) {
      setError("Vui lòng nhập hoặc chọn Contest ID trước khi lưu.");
      return;
    }

    if (rounds.length === 0) {
      setError("Cần ít nhất một vòng chấm.");
      return;
    }

    for (const round of rounds) {
      if (!round.name.trim()) {
        setError("Tên vòng chấm không được để trống.");
        return;
      }
      if (round.advanceCount < 1) {
        setError("Số lượng tác phẩm đi tiếp phải lớn hơn 0.");
        return;
      }
      if (round.startAt && round.endAt) {
        if (new Date(round.startAt) >= new Date(round.endAt)) {
          setError(`MSG008: Thời gian vòng "${round.name}" không hợp lệ.`);
          return;
        }
      }
    }

    setIsLoading(true);
    try {
      await http.put(`/api/v1/contests/${contestId.trim()}/rounds`, {
        rounds: rounds.map((round) => ({
          name: round.name.trim(),
          advanceCount: round.advanceCount,
          startAt: round.startAt ? new Date(round.startAt).toISOString() : null,
          endAt: round.endAt ? new Date(round.endAt).toISOString() : null,
          isActive: round.isActive,
        })),
      });
      setNotice("Đã lưu cấu hình vòng chấm thành công.");
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      setError(
        apiErr.response?.data?.message ??
          apiErr.response?.data?.error ??
          "API cấu hình vòng chấm chưa sẵn sàng hoặc có lỗi kết nối.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        href={contestId ? `/portal/contests/${contestId}` : "/portal/contests"}
        className="inline-flex items-center text-sm text-gray-500 hover:text-black"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Cấu hình vòng chấm</CardTitle>
          <CardDescription>
            Thiết lập các vòng Sơ loại, Bán kết, Chung kết và số lượng tác phẩm
            đi tiếp. Mỗi vòng có thể giới hạn thời gian chấm riêng.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={contestIdField}>Contest ID</Label>
            <Input
              id={contestIdField}
              value={contestId}
              onChange={() => undefined}
              placeholder="Truyền ?contestId=... trên URL"
              readOnly
            />
          </div>

          {rounds.map((round, index) => (
            <div key={round.key} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Vòng {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeRound(round.key)}
                  className="text-red-600"
                  disabled={rounds.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_160px]">
                <div className="space-y-2">
                  <Label>Tên vòng</Label>
                  <Input
                    value={round.name}
                    onChange={(e) =>
                      updateRound(round.key, { name: e.target.value })
                    }
                    placeholder="VD: Vòng Sơ loại"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Số bài đi tiếp</Label>
                  <Input
                    type="number"
                    min={1}
                    value={round.advanceCount}
                    onChange={(e) =>
                      updateRound(round.key, {
                        advanceCount: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Bắt đầu chấm</Label>
                  <Input
                    type="datetime-local"
                    value={round.startAt}
                    onChange={(e) =>
                      updateRound(round.key, { startAt: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kết thúc chấm</Label>
                  <Input
                    type="datetime-local"
                    value={round.endAt}
                    onChange={(e) =>
                      updateRound(round.key, { endAt: e.target.value })
                    }
                  />
                </div>
              </div>

              <label
                htmlFor={`round-active-${round.key}`}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  id={`round-active-${round.key}`}
                  type="checkbox"
                  checked={round.isActive}
                  onChange={(e) =>
                    updateRound(round.key, { isActive: e.target.checked })
                  }
                />
                Kích hoạt vòng chấm này
              </label>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addRound}
            className="w-full border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" /> Thêm vòng chấm
          </Button>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {notice && (
            <output className="block rounded-md border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
              {notice}
            </output>
          )}
        </CardContent>

        <CardFooter className="flex justify-end border-t p-6">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="bg-black text-white gap-2"
          >
            <Save className="w-4 h-4" />
            {isLoading ? "Đang lưu..." : "Lưu cấu hình"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function RoundsConfigPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-gray-500">Đang tải...</div>
      }
    >
      <RoundsConfigContent />
    </Suspense>
  );
}
