import { and, desc, eq } from "drizzle-orm";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { db } from "../db";
import { categories, contestNotifications, contests, submissionModerationLogs, submissions } from "../db/schema";
import type { AuthEnv } from "../middlewares/auth";
import { deleteFromR2, getR2SignedReadUrl, uploadToR2 } from "../r2";
import { AppError } from "../utils/errors";
import { ImageValidationError, validateImage } from "../utils/validate-image";

type Actor = AuthEnv["Variables"]["user"];
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Submission = typeof submissions.$inferSelect;
export type ProofType = NonNullable<Submission["proofType"]>;

export async function lockSubmission(tx: Transaction, submissionId: string) {
  const [reference] = await tx.select({ contestId: submissions.contestId }).from(submissions)
    .where(eq(submissions.id, submissionId));
  if (!reference) throw AppError.notFound("Submission not found");
  const [contest] = await tx.select().from(contests)
    .where(and(eq(contests.id, reference.contestId), eq(contests.isDeleted, false))).for("update");
  if (!contest) throw AppError.notFound("Submission not found");
  const [submission] = await tx.select().from(submissions)
    .where(and(eq(submissions.id, submissionId), eq(submissions.contestId, contest.id))).for("update");
  if (!submission) throw AppError.notFound("Submission not found");
  return { ...submission, contest };
}

export function requireReviewable(submission: Awaited<ReturnType<typeof lockSubmission>>, actor?: Actor) {
  if (actor && (actor.role !== "Organizer" || actor.id !== submission.contest.createdBy)) {
    throw AppError.notFound("Submission not found");
  }
  const status = submission.contest.status.toLowerCase();
  if (["judging", "in_judging", "published", "results_published", "completed", "archived", "cancelled"].includes(status)) {
    throw AppError.conflict("Contest moderation is closed");
  }
  if (["APPROVED", "APPROVED_FOR_JUDGING", "DISQUALIFIED", "DISQUALIFIED_NO_PROOF", "WITHDRAWN"].includes(submission.status)) {
    throw AppError.conflict("Submission already has a final moderation decision");
  }
}

export async function assertApprovalProof(tx: Transaction, submission: Submission) {
  const [category] = await tx.select({ required: categories.requireNegativeProof }).from(categories)
    .where(eq(categories.id, submission.categoryId));
  if ((category?.required || submission.proofRequestedAt || submission.negativeProofPath) &&
      (!submission.negativeProofPath || !submission.proofVerifiedAt)) {
    throw AppError.conflict("BR-06: Required proof must be uploaded and verified before approval");
  }
}

function proofData(submission: Submission, now = new Date()) {
  return {
    id: submission.id,
    status: submission.status,
    proofType: submission.proofType ?? (submission.negativeProofPath ? "negative" : null),
    proofRequestedAt: submission.proofRequestedAt,
    proofDeadlineAt: submission.proofDeadlineAt,
    proofVerifiedAt: submission.proofVerifiedAt,
    proofStatus: submission.proofVerifiedAt ? "VERIFIED" : submission.negativeProofPath ? "UPLOADED" :
      submission.proofDeadlineAt && submission.proofDeadlineAt <= now ? "OVERDUE" :
      submission.proofRequestedAt ? "REQUESTED" : null,
  };
}

export function requestProof(id: string, actor: Actor, proofType: ProofType, deadline: Date, reason: string) {
  return db.transaction(async (tx) => {
    const submission = await lockSubmission(tx, id);
    requireReviewable(submission, actor);
    const now = new Date();
    if (deadline <= now) throw AppError.badRequest("Proof deadline must be in the future");
    if (submission.negativeProofPath) throw AppError.conflict("Review the proof already attached to this submission");
    if (submission.proofType === proofType && submission.proofDeadlineAt?.getTime() === deadline.getTime()) {
      return proofData(submission, now);
    }

    const [updated] = await tx.update(submissions).set({
      status: "PROOF_REQUESTED", proofType, proofRequestedAt: now, proofDeadlineAt: deadline, updatedAt: now,
    }).where(eq(submissions.id, id)).returning();
    await tx.insert(submissionModerationLogs).values({
      submissionId: id, moderatorId: actor.id, action: "REQUEST_PROOF", reason,
      previousStatus: submission.status, newStatus: updated.status,
    });
    await tx.insert(contestNotifications).values({
      recipientId: submission.participantId, contestId: submission.contestId, kind: "PROOF_REQUESTED",
      data: { submissionId: id, proofType, proofDeadlineAt: deadline.toISOString(), reason },
    });
    return proofData(updated, now);
  });
}

export async function uploadProof(id: string, participant: Actor, file: File) {
  let image;
  try {
    image = await validateImage(file, {
      maxBytes: 20 * 1024 * 1024, minWidth: 1, minHeight: 1, maxPixels: 100_000_000,
    });
  } catch (error) {
    if (error instanceof ImageValidationError) throw new AppError(error.message, error.status as ContentfulStatusCode);
    throw error;
  }

  let key: string | undefined;
  try {
    return await db.transaction(async (tx) => {
      const submission = await lockSubmission(tx, id);
      if (submission.participantId !== participant.id) throw AppError.notFound("Submission not found");
      requireReviewable(submission);
      if (submission.status !== "PROOF_REQUESTED" || submission.negativeProofPath) {
        throw AppError.conflict("An open proof request is required");
      }
      if (!submission.proofDeadlineAt || submission.proofDeadlineAt <= new Date()) {
        throw AppError.conflict("Proof deadline has passed");
      }
      key = `proofs/${participant.id}/${crypto.randomUUID()}.${image.extension}`;
      await uploadToR2(new File([file], file.name, { type: image.contentType }), key);
      const now = new Date();
      if (submission.proofDeadlineAt <= now) throw AppError.conflict("Proof deadline has passed");
      const [updated] = await tx.update(submissions).set({
        status: "PROOF_SUBMITTED", negativeProofPath: key, updatedAt: now,
      }).where(eq(submissions.id, id)).returning();
      return proofData(updated, now);
    });
  } catch (error) {
    if (key) await deleteFromR2(key).catch((cleanupError) => console.error("Proof upload cleanup failed:", cleanupError));
    throw error;
  }
}

export function verifyProof(id: string, actor: Actor) {
  return db.transaction(async (tx) => {
    const submission = await lockSubmission(tx, id);
    requireReviewable(submission, actor);
    if (!submission.negativeProofPath) throw AppError.conflict("Upload proof before verifying it");
    if (submission.proofVerifiedAt) return proofData(submission);
    const now = new Date();
    const [updated] = await tx.update(submissions)
      .set({ proofVerifiedAt: now, proofVerifiedBy: actor.id, updatedAt: now })
      .where(eq(submissions.id, id)).returning();
    await tx.insert(submissionModerationLogs).values({
      submissionId: id, moderatorId: actor.id, action: "VERIFY_PROOF", reason: "Proof verified by organizer",
      previousStatus: submission.status, newStatus: updated.status,
    });
    return proofData(updated, now);
  });
}

async function readSubmissionForProof(id: string, actor: Actor) {
  const [row] = await db.select({ submission: submissions, owner: contests.createdBy }).from(submissions)
    .innerJoin(contests, eq(contests.id, submissions.contestId))
    .where(and(eq(submissions.id, id), eq(contests.isDeleted, false)));
  if (!row || !((actor.role === "Organizer" && actor.id === row.owner) ||
      (actor.role === "Participant" && actor.id === row.submission.participantId))) {
    throw AppError.notFound("Submission not found");
  }
  return row.submission;
}

export async function getSubmissionProofDetail(id: string, actor: Actor) {
  const submission = await readSubmissionForProof(id, actor);
  return {
    ...proofData(submission),
    contestId: submission.contestId, categoryId: submission.categoryId, title: submission.title,
    proofUrl: submission.negativeProofPath ? `/api/v1/submissions/${id}/proof/image` : null,
  };
}

export async function getSubmissionProofImage(id: string, actor: Actor) {
  const { negativeProofPath: key } = await readSubmissionForProof(id, actor);
  if (!key || !/^proofs\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(?:jpg|jpeg|png|tif|tiff)$/i.test(key)) {
    throw AppError.notFound("Proof image not found");
  }
  const file = Bun.file(`uploads/${key}`);
  const headers = { "Cache-Control": "private, no-store" };
  if (await file.exists()) return new Response(file, { headers });
  const location = await getR2SignedReadUrl(key);
  if (!location.startsWith("https://")) throw AppError.notFound("Proof image not found");
  return new Response(null, { status: 302, headers: { ...headers, Location: location } });
}

export function listContestNotifications(recipientId: string) {
  return db.select({
    id: contestNotifications.id, contestId: contestNotifications.contestId, kind: contestNotifications.kind,
    data: contestNotifications.data, createdAt: contestNotifications.createdAt,
  }).from(contestNotifications).where(eq(contestNotifications.recipientId, recipientId))
    .orderBy(desc(contestNotifications.createdAt)).limit(100);
}
