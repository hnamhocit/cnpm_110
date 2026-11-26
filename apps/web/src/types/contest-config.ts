export const CONTEST_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "OPEN",
  "VERIFYING",
  "IN_JUDGING",
  "RESULTS_PUBLISHED",
  "ARCHIVED",
] as const;

export type ContestStatus = (typeof CONTEST_STATUSES)[number];

export type LegacyContestStatus =
  | Lowercase<ContestStatus>
  | "under_review"
  | "judging"
  | "published"
  | "completed"
  | "ongoing"
  | "cancelled";

export type ContestStatusValue = ContestStatus | LegacyContestStatus;

export type FormatRestriction = "135" | "120" | "4x5" | "ALL";

export interface ContestTimeline {
  registrationStartAt: string;
  submissionDeadlineAt: string;
  judgingStartAt: string;
  judgingDeadlineAt: string;
  publishedAt: string;
}

export interface CriterionConfig {
  code: string;
  name: string;
  weight: number;
  maxScore?: number;
}

export interface CategoryConfig {
  id?: string;
  code: string;
  name: string;
  formatRestriction: FormatRestriction;
  maxEntriesPerParticipant: number;
  requireNegativeProofUpfront: boolean;
  isActive?: boolean;
  criteria?: CriterionConfig[];
}

export interface AwardConfig {
  code: string;
  name: string;
  rankOrder: number;
  prizeValueVnd: number;
  quota: number;
}

export interface ContestConfigInput extends ContestTimeline {
  name: string;
  slug?: string;
  theme: string;
  rules: string;
  coverImageUrl?: string;
  maxEntriesPerUser: number;
  categories: CategoryConfig[];
  awards: AwardConfig[];
  status: ContestStatus;
}

export interface ContestConfigRecord extends Partial<ContestTimeline> {
  id: string;
  code?: string | null;
  status: ContestStatusValue;
  name: string;
  description?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  slug?: string | null;
  theme?: string | null;
  rules?: string | null;
  coverImageUrl?: string | null;
  maxEntriesPerUser?: number | null;
  registration_start_at?: string | null;
  submission_deadline_at?: string | null;
  judging_start_at?: string | null;
  judging_deadline_at?: string | null;
  published_at?: string | null;
  categories?: CategoryConfig[];
  awards?: AwardConfig[];
  createdAt?: string | null;
  created_at?: string | null;
}

export interface CategoryRecord {
  id: string;
  contestId: string;
  contest_id?: string;
  name: string;
  code?: string | null;
  description?: string | null;
  formatRestriction?: FormatRestriction | string | null;
  format_restriction?: FormatRestriction | string | null;
  maxEntriesPerParticipant?: number | null;
  max_entries_per_participant?: number | null;
  requireNegativeProofUpfront?: boolean | null;
  require_negative_proof_upfront?: boolean | null;
  isActive?: boolean | null;
  is_active?: boolean | null;
  status?: string | null;
  createdAt?: string | null;
}

export const CONTEST_STATUS_LABELS: Record<ContestStatus, string> = {
  DRAFT: "Bản nháp",
  SCHEDULED: "Đã lên lịch",
  OPEN: "Đang mở nhận bài",
  VERIFYING: "Đang thẩm định",
  IN_JUDGING: "Đang chấm điểm",
  RESULTS_PUBLISHED: "Đã công bố kết quả",
  ARCHIVED: "Đã lưu trữ",
};

export const FORMAT_RESTRICTION_LABELS: Record<FormatRestriction, string> = {
  "135": "35mm (135)",
  "120": "Medium format (120)",
  "4x5": "Large format (4x5)",
  ALL: "Không giới hạn",
};

export const CONTEST_TIMELINE_LABELS: Record<keyof ContestTimeline, string> = {
  registrationStartAt: "Bắt đầu đăng ký",
  submissionDeadlineAt: "Hạn chót nộp bài",
  judgingStartAt: "Bắt đầu chấm thi",
  judgingDeadlineAt: "Kết thúc chấm thi",
  publishedAt: "Công bố kết quả",
};

export const DEFAULT_MAX_SCORE = 10;

export function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

export function toPercent(weight: number): number {
  return round4(weight * 100);
}

export function fromPercent(percent: number): number {
  return round4(percent / 100);
}

export function normalizeContestStatus(value?: string | null): ContestStatus {
  const upper = (value ?? "").trim().toUpperCase();
  if (upper === "UNDER_REVIEW" || upper === "VERIFYING") return "VERIFYING";
  if (upper === "JUDGING" || upper === "IN_JUDGING") return "IN_JUDGING";
  if (upper === "PUBLISHED" || upper === "COMPLETED")
    return "RESULTS_PUBLISHED";
  if (upper === "ONGOING") return "OPEN";
  if (upper === "CANCELLED") return "ARCHIVED";
  return CONTEST_STATUSES.find((status) => status === upper) ?? "DRAFT";
}

export function isFormatRestriction(
  value: unknown,
): value is FormatRestriction {
  return (
    value === "135" || value === "120" || value === "4x5" || value === "ALL"
  );
}
