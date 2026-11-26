import type { Context } from "hono";
import type { AuthEnv } from "../middlewares/auth";
import {
  approveSubmission,
  createSubmission,
  getSubmissionComparison,
  listAllSubmissions,
  listMySubmissions,
  rejectSubmission,
  type ModerationAction,
} from "../services/submission.service";
import {
  getSubmissionProofDetail, getSubmissionProofImage, listContestNotifications, requestProof, uploadProof,
  verifyProof, type ProofType,
} from "../services/submission-proof";
import { getMySubmissionResultAndFeedback } from "../services/contest-results-feedback";
import { AppError } from "../utils/errors";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_SUBMISSION_STATUSES = [
  "PENDING_AI",
  "VERIFIED",
  "SUSPICIOUS",
  "FLAGGED",
  "APPROVED",
  "DISQUALIFIED",
  "PROOF_REQUESTED",
  "PROOF_SUBMITTED",
  "WITHDRAWN",
  "APPROVED_FOR_JUDGING",
  "DISQUALIFIED_NO_PROOF",
] as const;

const VALID_MODERATION_ACTIONS: readonly ModerationAction[] = [
  "APPROVE_FOR_JUDGING",
  "DISQUALIFY",
  "REQUEST_PROOF",
  "OVERRIDE_AI_FLAG",
];

function assertUuid(value: string, label: string) {
  if (!UUID_REGEX.test(value)) {
    throw AppError.badRequest(`Invalid ${label} format`);
  }
}

function textField(
  form: FormData,
  name: string,
  maxLength: number,
  required = false,
): string | null {
  const values = form.getAll(name);
  if (values.length > 1) {
    throw AppError.badRequest(`${name} must appear only once`);
  }

  const value = values[0];
  if (value !== undefined && typeof value !== "string") {
    throw AppError.badRequest(`${name} must be text`);
  }

  const text = typeof value === "string" ? value.trim() : "";
  if (required && !text) {
    throw AppError.badRequest(`${name} is required`);
  }
  if (text.length > maxLength) {
    throw AppError.badRequest(`${name} exceeds ${maxLength} characters`);
  }

  return text || null;
}

function uuidField(form: FormData, name: string): string {
  const value = textField(form, name, 36, true)!;
  if (!UUID_REGEX.test(value)) {
    throw AppError.badRequest(`${name} must be a UUID`);
  }
  return value;
}

function positiveIntegerField(form: FormData, name: string): number {
  const value = textField(form, name, 10, true)!;
  if (!/^\d+$/.test(value)) {
    throw AppError.badRequest(`${name} must be a positive integer`);
  }

  const num = Number(value);
  if (!Number.isSafeInteger(num) || num <= 0 || num > 2147483647) {
    throw AppError.badRequest(`${name} is outside the allowed range`);
  }
  return num;
}

function fileField(form: FormData, name: string, required: boolean): File | null {
  const values = form.getAll(name);
  if (values.length > 1) {
    throw AppError.badRequest(`${name} must appear only once`);
  }

  const value = values[0];
  if (value === undefined && !required) {
    return null;
  }
  if (!(value instanceof File) || value.size === 0) {
    throw AppError.badRequest(`${name} must be a non-empty file`);
  }
  return value;
}

export async function handleGetMySubmissions(c: Context<AuthEnv>) {
  const user = c.get("user");
  if (!user?.id) {
    throw AppError.unauthorized("Unauthorized");
  }

  const contestId = c.req.query("contestId");
  const status = c.req.query("status");

  if (contestId) assertUuid(contestId, "contestId");

  const items = await listMySubmissions({
    participantId: user.id,
    contestId,
    status,
  });

  return c.ok(items, "Lấy danh sách bài thi thành công");
}

export async function handleListSubmissions(c: Context<AuthEnv>) {
  const statusParam = c.req.query("status");
  const aiFlaggedParam = c.req.query("aiFlagged");
  const contestId = c.req.query("contestId");
  const categoryId = c.req.query("categoryId");
  const search = c.req.query("search")?.trim();
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(c.req.query("limit") || "20", 10) || 20),
  );

  if (contestId) assertUuid(contestId, "contestId");
  if (categoryId) assertUuid(categoryId, "categoryId");

  if (
    statusParam &&
    !(VALID_SUBMISSION_STATUSES as readonly string[]).includes(statusParam)
  ) {
    throw AppError.badRequest(
      `Invalid status. Allowed statuses: ${VALID_SUBMISSION_STATUSES.join(", ")}`,
    );
  }

  if (
    aiFlaggedParam !== undefined &&
    aiFlaggedParam !== "true" &&
    aiFlaggedParam !== "false"
  ) {
    throw AppError.badRequest("aiFlagged must be 'true' or 'false'");
  }

  const actor = c.get("user");
  const { items, pagination } = await listAllSubmissions({
    contestId,
    categoryId,
    status: statusParam,
    organizerId: actor.role === "Organizer" ? actor.id : undefined,
    aiFlagged:
      aiFlaggedParam === undefined ? undefined : aiFlaggedParam === "true",
    search,
    page,
    limit,
  });

  return c.json(
    {
      code: 200,
      message: "Submissions retrieved successfully",
      data: items,
      pagination,
      error: null,
    },
    200,
  );
}

export async function handleCreateSubmission(c: Context<AuthEnv>) {
  if (
    !c.req
      .header("Content-Type")
      ?.toLowerCase()
      .startsWith("multipart/form-data")
  ) {
    throw new AppError("Use multipart/form-data", 415);
  }

  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    throw AppError.badRequest("Invalid multipart form");
  }

  const participantId = c.get("user").id;
  const contestId = uuidField(form, "contestId");
  const categoryId = uuidField(form, "categoryId");
  const title = textField(form, "title", 255, true)!;
  const description = textField(form, "description", 5000);

  const rollId = textField(form, "rollId", 100);
  const frameNumber = positiveIntegerField(form, "frameNumber");
  const filmFormat = textField(form, "filmFormat", 50, true)!;
  if (!["135", "120_645", "120_66", "120_67", "4x5"].includes(filmFormat)) {
    throw new AppError("Invalid film format", 422);
  }

  const devLabName = textField(form, "devLabName", 150);
  const devChemistry = textField(form, "devChemistry", 50);
  if (!devLabName && !devChemistry) {
    throw new AppError("Development lab or process is required", 422);
  }

  // BR-05: Bắt buộc nhập mã cuộn phim và số frame
  if (!rollId) {
    throw AppError.badRequest("Film roll ID and frame number are required");
  }

  const metadata = {
    filmBrand: textField(form, "filmBrand", 100, true)!,
    filmStock: textField(form, "filmStock", 150, true)!,
    filmFormat,
    isoRated: positiveIntegerField(form, "isoRated"),
    isoShot: positiveIntegerField(form, "isoShot"),
    cameraBody: textField(form, "cameraBody", 150, true)!,
    lens: textField(form, "lens", 150),
    rollId,
    frameNumber: String(frameNumber),
    devLabName,
    devChemistry,
    scannerModel: textField(form, "scannerModel", 150),
  };

  const image = fileField(form, "image", true)!;
  const negativeProof = fileField(form, "negativeProof", false);

  const created = await createSubmission({
    participantId,
    contestId,
    categoryId,
    title,
    description,
    metadata,
    image,
    negativeProof,
  });

  return c.created(created, "Submission created successfully");
}

export async function handleApproveSubmission(c: Context<AuthEnv>) {
  const id = c.req.param("id");
  assertUuid(id!, "submission ID");

  const body = await c.req.json<{ reason?: unknown }>().catch(() => ({} as { reason?: unknown }));
  const reason = typeof body.reason === "string" ? body.reason : undefined;

  const updated = await approveSubmission(id!, c.get("user"), reason);
  return c.ok(updated, "Submission approved successfully");
}

export async function handleRejectSubmission(c: Context<AuthEnv>) {
  const id = c.req.param("id");
  assertUuid(id!, "submission ID");

  let body: { reason?: unknown };
  try {
    body = await c.req.json<{ reason?: unknown }>();
  } catch {
    throw AppError.badRequest("Invalid JSON body");
  }

  // BR-18: Bắt buộc nhập lý do chi tiết tối thiểu 10 ký tự
  if (typeof body.reason !== "string" || body.reason.trim().length < 10) {
    throw new AppError(
      "Vui lòng nhập lý do cụ thể trước khi phê duyệt hoặc loại tác phẩm dự thi (Tối thiểu 10 ký tự).",
      422,
    );
  }

  const trimmedReason = body.reason.trim();
  if (trimmedReason.length > 1000) {
    throw AppError.badRequest("Reason must not exceed 1000 characters");
  }

  const updated = await rejectSubmission(id!, c.get("user"), trimmedReason);
  return c.ok(updated, "Submission rejected successfully");
}

export async function handleModerateSubmission(c: Context<AuthEnv>) {
  const id = c.req.param("id");
  assertUuid(id!, "submission ID");

  let body: { action?: unknown; reason?: unknown; proofType?: unknown; proofDeadlineAt?: unknown };
  try {
    body = await c.req.json<typeof body>();
  } catch {
    throw AppError.badRequest("Invalid JSON body");
  }

  if (
    typeof body.action !== "string" ||
    !(VALID_MODERATION_ACTIONS as readonly string[]).includes(body.action)
  ) {
    throw AppError.badRequest(
      `Invalid action. Allowed actions: ${VALID_MODERATION_ACTIONS.join(", ")}`,
    );
  }

  const action = body.action as ModerationAction;
  const reasonText = typeof body.reason === "string" ? body.reason.trim() : "";

  if (
    ["DISQUALIFY", "REQUEST_PROOF", "OVERRIDE_AI_FLAG"].includes(action) &&
    reasonText.length < 10
  ) {
    throw new AppError(
      "Vui lòng nhập lý do cụ thể trước khi phê duyệt hoặc loại tác phẩm dự thi (Tối thiểu 10 ký tự).",
      422,
    );
  }

  const actor = c.get("user");
  const updated = action === "REQUEST_PROOF"
    ? await requestProof(id!, actor, ...proofRequestFields(body))
    : action === "DISQUALIFY"
      ? await rejectSubmission(id!, actor, reasonText)
      : await approveSubmission(id!, actor, reasonText);

  return c.ok(updated, "Submission moderation updated successfully");
}

export async function handleGetSubmissionComparison(c: Context<AuthEnv>) {
  const id = c.req.param("id");
  assertUuid(id!, "submission ID");

  const data = await getSubmissionComparison(id!, c.get("user"));
  return c.ok(data, "Flagged submission comparison retrieved successfully");
}

function proofRequestFields(body: { proofType?: unknown; proofDeadlineAt?: unknown; reason?: unknown }): [ProofType, Date, string] {
  if (!body || (body.proofType !== "negative" && body.proofType !== "contact_sheet")) {
    throw AppError.badRequest("proofType must be negative or contact_sheet");
  }
  const deadline = body.proofDeadlineAt;
  if (typeof deadline !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{1,3})?)?(?:Z|[+-]\d\d:\d\d)$/.test(deadline)
      || !Number.isFinite(Date.parse(deadline))) {
    throw AppError.badRequest("proofDeadlineAt must be a timestamp with a timezone");
  }
  if (body.reason !== undefined && (typeof body.reason !== "string" || body.reason.length > 1000)) {
    throw AppError.badRequest("Proof reason must be a string of at most 1000 characters");
  }
  return [body.proofType, new Date(deadline), body.reason?.trim() || "Organizer requested film proof"];
}

export async function handleRequestSubmissionProof(c: Context<AuthEnv>) {
  const id = c.req.param("id") ?? "";
  assertUuid(id, "submission ID");
  const body = await c.req.json<Parameters<typeof proofRequestFields>[0]>().catch(() => {
    throw AppError.badRequest("Invalid JSON body");
  });
  return c.ok(await requestProof(id, c.get("user"), ...proofRequestFields(body)), "MSG018: Proof requested");
}

export async function handleUploadSubmissionProof(c: Context<AuthEnv>) {
  const id = c.req.param("id") ?? "";
  assertUuid(id, "submission ID");
  const form = await c.req.formData().catch(() => { throw AppError.badRequest("Invalid multipart form"); });
  return c.created(await uploadProof(id, c.get("user"), fileField(form, "proof", true)!), "MSG019: Proof uploaded");
}

export async function handleVerifySubmissionProof(c: Context<AuthEnv>) {
  const id = c.req.param("id") ?? "";
  assertUuid(id, "submission ID");
  return c.ok(await verifyProof(id, c.get("user")));
}

export async function handleGetSubmissionProofDetail(c: Context<AuthEnv>) {
  const id = c.req.param("id") ?? "";
  assertUuid(id, "submission ID");
  return c.ok(await getSubmissionProofDetail(id, c.get("user")));
}

export async function handleGetContestNotifications(c: Context<AuthEnv>) {
  return c.ok(await listContestNotifications(c.get("user").id));
}

export async function handleGetSubmissionProofImage(c: Context<AuthEnv>) {
  const id = c.req.param("id") ?? "";
  assertUuid(id, "submission ID");
  return getSubmissionProofImage(id, c.get("user"));
}

export async function handleGetSubmissionFeedback(c: Context<AuthEnv>) {
  const id = c.req.param("id") ?? "";
  assertUuid(id, "submission ID");
  const data = await getMySubmissionResultAndFeedback(id, c.get("user").id);
  return c.ok(data, "Submission results and feedback retrieved successfully");
}
