"use client";

import { Award, Lock, ShieldAlert, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getContestResults, getResultsErrorMessage } from "@/lib/results-api";
import {
  formatOfficialScore,
  isOfficialResults,
} from "@/lib/results-validation";
import type {
  ContestResults,
  LegacyResultWinner,
  OfficialResultEntry,
} from "@/types/results";

function formatPublishedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN");
}

function formatPrize(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString("vi-VN")} ₫`;
}

function OfficialRows({ entries }: { entries: OfficialResultEntry[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
          <tr>
            <th className="px-3 py-2">Hạng</th>
            <th className="px-3 py-2">Mã bài</th>
            <th className="px-3 py-2">Tác phẩm</th>
            <th className="px-3 py-2">Tác giả</th>
            <th className="px-3 py-2 text-right">Điểm</th>
            <th className="px-3 py-2">Giải</th>
            <th className="px-3 py-2 text-right">Giá trị giải</th>
            <th className="px-3 py-2">Bằng chứng</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {entries.map((entry) => (
            <tr key={entry.submissionId}>
              <td className="px-3 py-2 font-semibold">{entry.rank}</td>
              <td className="px-3 py-2 font-mono text-xs text-slate-500">
                {entry.submissionCode ?? entry.submissionId}
              </td>
              <td className="px-3 py-2">
                <span className="font-medium">{entry.title}</span>
                {entry.categoryName ? (
                  <span className="ml-2 text-xs text-slate-400">
                    {entry.categoryName}
                  </span>
                ) : null}
              </td>
              <td className="px-3 py-2">{entry.authorName}</td>
              <td className="px-3 py-2 text-right font-semibold">
                {formatOfficialScore(entry.finalScore)}
              </td>
              <td className="px-3 py-2">
                {entry.awardTitle ?? entry.award ?? "—"}
              </td>
              <td className="px-3 py-2 text-right">
                {formatPrize(entry.prizeValueVnd)}
              </td>
              <td className="px-3 py-2">
                {entry.isProofVerified ? (
                  <Badge variant="valid">
                    <ShieldCheck className="h-3 w-3" /> Đã xác minh
                  </Badge>
                ) : (
                  <Badge variant="ai-warning">Chưa xác minh</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LegacyRows({ winners }: { winners: LegacyResultWinner[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
          <tr>
            <th className="px-3 py-2">Hạng</th>
            <th className="px-3 py-2">Mã bài</th>
            <th className="px-3 py-2">Tác phẩm</th>
            <th className="px-3 py-2">Tác giả</th>
            <th className="px-3 py-2 text-right">Điểm</th>
            <th className="px-3 py-2">Giải</th>
            <th className="px-3 py-2 text-right">Giá trị giải</th>
            <th className="px-3 py-2">Bằng chứng</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {winners.map((winner, index) => (
            <tr
              key={
                winner.submissionId ?? `${winner.title ?? "winner"}-${index}`
              }
            >
              <td className="px-3 py-2 font-semibold">{winner.rank ?? "—"}</td>
              <td className="px-3 py-2 font-mono text-xs text-slate-500">
                {winner.submissionCode ?? winner.submissionId ?? "—"}
              </td>
              <td className="px-3 py-2">{winner.title ?? "—"}</td>
              <td className="px-3 py-2">{winner.authorName ?? "—"}</td>
              <td className="px-3 py-2 text-right font-semibold">
                {formatOfficialScore(winner.finalScore ?? null)}
              </td>
              <td className="px-3 py-2">
                {winner.awardTitle ?? winner.award ?? "—"}
              </td>
              <td className="px-3 py-2 text-right">
                {formatPrize(winner.prizeValueVnd)}
              </td>
              <td className="px-3 py-2">
                {winner.isProofVerified === undefined ? (
                  "—"
                ) : winner.isProofVerified ? (
                  <Badge variant="valid">Đã xác minh</Badge>
                ) : (
                  <Badge variant="ai-warning">Chưa xác minh</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OfficialResultsView({
  contestId,
  title,
}: {
  contestId: string;
  title?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unpublished, setUnpublished] = useState(false);
  const [results, setResults] = useState<ContestResults | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setUnpublished(false);
    setResults(null);

    getContestResults(contestId)
      .then((data) => {
        if (!active) return;
        setResults(data);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status === 400 || status === 404 || status === 409) {
          setUnpublished(true);
          return;
        }
        setError(getResultsErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [contestId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-slate-500">
          Đang tải kết quả chính thức...
        </CardContent>
      </Card>
    );
  }

  if (unpublished) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-base font-semibold text-slate-900">
            Chưa công bố kết quả
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Kết quả chính thức sẽ hiển thị sau khi Ban tổ chức chốt và công bố.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-red-600">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (results && isOfficialResults(results)) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {title ?? results.contestName ?? "Bảng xếp hạng chính thức"}
            </h2>
            <p className="text-xs text-slate-500">
              Công bố lúc {formatPublishedAt(results.publishedAt)}
            </p>
          </div>
          <Badge variant="valid" className="text-sm">
            <Lock className="h-3.5 w-3.5" />
            RESULTS_PUBLISHED · Đã khóa
          </Badge>
        </div>

        <Card>
          <CardHeader className="border-b pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4 text-amber-600" /> Bảng điểm chính thức
            </CardTitle>
            <CardDescription>
              Điểm, hạng và giải đã bị khóa theo BR-16; không cho chỉnh sửa.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <OfficialRows entries={results.entries} />
          </CardContent>
        </Card>

        {results.winners.length > 0 ? (
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-base">Danh sách đoạt giải</CardTitle>
              <CardDescription>
                {results.winners.length} tác phẩm được gán giải chính thức.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <OfficialRows entries={results.winners} />
            </CardContent>
          </Card>
        ) : null}
      </div>
    );
  }

  if (results && Array.isArray(results.winners)) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Dữ liệu kết quả dạng cũ; không hiển thị điểm giả lập khi chưa có
            snapshot chính thức
          </span>
        </div>
        <Card>
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-base">Winners showcase</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <LegacyRows winners={results.winners} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-8 text-center text-sm text-slate-500">
        Không có dữ liệu kết quả.
      </CardContent>
    </Card>
  );
}
