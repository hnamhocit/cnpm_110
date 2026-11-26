import { pool } from "../db";
import { sendEmail } from "./identity-delivery";

export type BusinessEmailSender = (to: string, subject: string, text: string) => Promise<void>;

function message(kind: string, contestName: string, data: Record<string, unknown>) {
  if (kind === "PROOF_REQUESTED") {
    return `Cuộc thi ${contestName}\nBài thi ${data.submissionId}\nLoại đối chứng ${data.proofType}\nHạn bổ sung ${data.proofDeadlineAt}\n${data.reason ?? ""}`;
  }
  if (kind === "SUBMISSION_STATUS") {
    return `Cuộc thi ${contestName}\nBài thi ${data.submissionId}\nTrạng thái ${data.status}\n${data.reason ?? ""}`;
  }
  return `Kết quả chính thức cuộc thi ${contestName} đã được công bố. Đăng nhập CINEGEN để xem kết quả và nhận xét của bài thi của bạn.`;
}

/** Explicit retry also processes FAILED rows. One worker locks each delivery at a time. */
export async function deliverNotificationEmails(send: BusinessEmailSender = sendEmail, limit = 50, notificationId?: string) {
  const client = await pool.connect();
  const result = { sent: 0, failed: 0 };
  try {
    await client.query("BEGIN");
    const pending = await client.query(`
      SELECT q.id,q.recipient,n.kind,n.data,c.name FROM notification_emails q
      JOIN contest_notifications n ON n.id=q.notification_id JOIN contests c ON c.id=n.contest_id
      WHERE q.status IN ('PENDING','FAILED') AND ($2::uuid IS NULL OR q.notification_id=$2::uuid) ORDER BY q.created_at
      FOR UPDATE OF q SKIP LOCKED LIMIT $1`, [limit, notificationId ?? null]);
    for (const row of pending.rows) {
      try {
        await send(row.recipient, `CINEGEN · ${row.kind}`, message(row.kind, row.name, row.data));
        await client.query("UPDATE notification_emails SET status='SENT',attempts=attempts+1,last_error=NULL,sent_at=now() WHERE id=$1", [row.id]);
        result.sent++;
      } catch {
        // Persist a fixed error. SMTP provider errors can contain credentials and addresses.
        await client.query("UPDATE notification_emails SET status='FAILED',attempts=attempts+1,last_error='Email delivery unavailable' WHERE id=$1", [row.id]);
        result.failed++;
      }
    }
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export function startNotificationDelivery() {
  let active: Promise<unknown> | undefined;
  const tick = () => {
    if (active) return;
    active = deliverNotificationEmails().catch(() => {
      console.error("Notification delivery worker unavailable");
    }).finally(() => { active = undefined; });
  };
  const timer = setInterval(tick, 30_000);
  return async () => {
    clearInterval(timer);
    await active;
  };
}
