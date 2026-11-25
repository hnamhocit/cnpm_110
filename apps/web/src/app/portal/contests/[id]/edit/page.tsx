import { notFound } from "next/navigation";

import {
  ContestWizard,
  type ContestWizardInitial,
} from "@/components/contest/contest-wizard";
import { API_INTERNAL_URL } from "@/lib/server-api";

type EditContestPageProps = {
  params: Promise<{ id: string }>;
};

type RawRecord = Record<string, unknown>;

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

async function fetchJson(url: string): Promise<unknown> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const json = await response.json();
    return json?.data ?? json;
  } catch {
    return null;
  }
}

export default async function EditContestPage({
  params,
}: EditContestPageProps) {
  const { id } = await params;

  const [contestRaw, categoriesRaw] = await Promise.all([
    fetchJson(`${API_INTERNAL_URL}/api/v1/contests/${id}`),
    fetchJson(`${API_INTERNAL_URL}/api/v1/contests/${id}/categories`),
  ]);

  const contest = asRecord(contestRaw);
  if (!contest) notFound();

  const categories = Array.isArray(categoriesRaw)
    ? categoriesRaw
    : Array.isArray((categoriesRaw as RawRecord | null)?.items)
      ? ((categoriesRaw as RawRecord).items as unknown[])
      : [];

  const startAt = contest.registrationStartAt ?? contest.startAt;
  const endAt =
    contest.publishedAt ?? contest.judgingDeadlineAt ?? contest.endAt;

  const initial: ContestWizardInitial = {
    name: asString(contest.name),
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

  return <ContestWizard mode="edit" contestId={id} initial={initial} />;
}
