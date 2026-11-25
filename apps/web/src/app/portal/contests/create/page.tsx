"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import {
  ContestWizard,
  type ContestWizardInitial,
} from "@/components/contest/contest-wizard";
import { http } from "@/lib/http";

type RawRecord = Record<string, unknown>;

function unwrap(raw: unknown): unknown {
  if (raw && typeof raw === "object" && "data" in raw) {
    return (raw as { data: unknown }).data;
  }
  return raw;
}

function asRecord(value: unknown): RawRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RawRecord)
    : null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toLocalDateTime(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

async function loadDuplicate(id: string): Promise<ContestWizardInitial> {
  const [contestRes, categoriesRes] = await Promise.all([
    http.get(`/api/v1/contests/${id}`),
    http.get(`/api/v1/contests/${id}/categories`),
  ]);

  const contest = asRecord(unwrap(contestRes.data)) ?? {};
  const categoriesRaw = unwrap(categoriesRes.data);
  const categories = Array.isArray(categoriesRaw)
    ? categoriesRaw
    : Array.isArray((categoriesRaw as RawRecord | null)?.items)
      ? ((categoriesRaw as RawRecord).items as unknown[])
      : [];

  const startAt = contest.registrationStartAt ?? contest.startAt;
  const endAt =
    contest.publishedAt ?? contest.judgingDeadlineAt ?? contest.endAt;

  return {
    name: `${asString(contest.name) || "Cuộc thi"} (Bản sao)`,
    theme: asString(contest.theme),
    description: asString(contest.description),
    rules: asString(contest.rules),
    coverImageUrl: asString(contest.coverImageUrl),
    maxEntriesPerUser:
      typeof contest.maxEntriesPerUser === "number"
        ? contest.maxEntriesPerUser
        : 5,
    schedule: {
      registrationStartAt: toLocalDateTime(startAt),
      submissionDeadlineAt: toLocalDateTime(
        contest.submissionDeadlineAt ?? endAt,
      ),
      judgingStartAt: toLocalDateTime(contest.judgingStartAt ?? endAt),
      judgingDeadlineAt: toLocalDateTime(contest.judgingDeadlineAt ?? endAt),
      publishedAt: toLocalDateTime(contest.publishedAt),
    },
    categories: categories.map((raw) => {
      const category = asRecord(raw) ?? {};
      const criteriaRaw = Array.isArray(category.criteria)
        ? category.criteria
        : [];
      return {
        name: asString(category.name),
        description: asString(category.description),
        formatRestriction: asString(category.formatRestriction) || "ALL",
        maxEntriesPerParticipant:
          typeof category.maxEntriesPerParticipant === "number"
            ? category.maxEntriesPerParticipant
            : 3,
        requireNegativeProofUpfront:
          category.requireNegativeProofUpfront === true,
        criteria: criteriaRaw.map((rawCriterion) => {
          const criterion = asRecord(rawCriterion) ?? {};
          const weight =
            typeof criterion.weight === "number"
              ? criterion.weight
              : Number(criterion.weight ?? 0);
          return {
            name: asString(criterion.name),
            weightPercent: weight,
            maxScore:
              typeof criterion.maxScore === "number"
                ? criterion.maxScore
                : Number(criterion.maxScore ?? 10),
          };
        }),
      };
    }),
  };
}

function CreateContestContent() {
  const searchParams = useSearchParams();
  const duplicateId = searchParams.get("duplicate");
  const [initial, setInitial] = useState<ContestWizardInitial | undefined>();
  const [loading, setLoading] = useState(Boolean(duplicateId));

  useEffect(() => {
    if (!duplicateId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    loadDuplicate(duplicateId)
      .then((data) => {
        if (!cancelled) setInitial(data);
      })
      .catch(() => {
        // Không tải được bản gốc thì mở form trống.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [duplicateId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Đang tải dữ liệu cuộc thi để nhân bản...
      </div>
    );
  }

  return <ContestWizard mode="create" initial={initial} />;
}

export default function CreateContestPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-gray-500">Đang tải...</div>
      }
    >
      <CreateContestContent />
    </Suspense>
  );
}
