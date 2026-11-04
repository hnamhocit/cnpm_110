
import { pool } from "../db";

export interface ClaimedAiJob {
  id: string;
  submissionId: string;
  attempts: number;
  maxAttempts: number;
}

export async function claimNextAiJob():
  Promise<ClaimedAiJob | null> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query<{
      id: string;
      submission_id: string;
      attempts: number;
      max_attempts: number;
    }>(`
      SELECT
        id,
        submission_id,
        attempts,
        max_attempts
      FROM ai_analysis_jobs
      WHERE status = 'PENDING'
        AND attempts < max_attempts
      ORDER BY created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    `);

    const job = result.rows[0];

    if (!job) {
      await client.query("COMMIT");
      return null;
    }

    await client.query(
      `
      UPDATE ai_analysis_jobs
      SET
        status = 'PROCESSING',
        attempts = attempts + 1,
        updated_at = NOW()
      WHERE id = $1
      `,
      [job.id],
    );

    await client.query("COMMIT");

    return {
      id: job.id,
      submissionId: job.submission_id,
      attempts: job.attempts + 1,
      maxAttempts: job.max_attempts,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function failAiJob(
  job: ClaimedAiJob,
  error: unknown,
): Promise<void> {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  const nextStatus =
    job.attempts < job.maxAttempts
      ? "PENDING"
      : "FAILED";

  await pool.query(
    `
    UPDATE ai_analysis_jobs
    SET
      status = $1,
      last_error = $2,
      updated_at = NOW()
    WHERE id = $3
      AND submission_id = $4
      AND status = 'PROCESSING'
      AND attempts = $5
    `,
    [
      nextStatus,
      message.slice(0, 2000),
      job.id,
      job.submissionId,
      job.attempts,
    ],
  );
}

export async function recoverStaleAiJobs(
  staleAfterMinutes = 10,
): Promise<number> {
  if (
    !Number.isInteger(staleAfterMinutes) ||
    staleAfterMinutes < 3 ||
    staleAfterMinutes > 1440
  ) {
    throw new RangeError(
      "staleAfterMinutes must be between 3 and 1440",
    );
  }

  const result = await pool.query(
    `
    UPDATE ai_analysis_jobs
    SET
      status = CASE
        WHEN attempts < max_attempts
          THEN 'PENDING'
        ELSE 'FAILED'
      END,
      last_error = 'Worker interrupted or job timed out',
      updated_at = NOW()
    WHERE status = 'PROCESSING'
      AND updated_at < NOW() - ($1::integer * INTERVAL '1 minute')
    RETURNING id
    `,
    [staleAfterMinutes],
  );

  return result.rowCount ?? 0;
}
