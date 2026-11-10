
import { pool } from "./db";
import {
  claimNextAiJob,
  failAiJob,
  recoverStaleAiJobs,
} from "./services/ai-job-queue";
import { processAiJob } from "./services/ai-job-processor";

const POLL_INTERVAL_MS = 5000;
const RECOVERY_INTERVAL_MS = 60_000;

async function main(): Promise<void> {
  // Safety: require explicit permission before running the AI Worker.
  if (process.env.AI_WORKER_ENABLED !== "true") {
    throw new Error(
      "AI Worker is disabled. Set AI_WORKER_ENABLED=true to enable it.",
    );
  }

  const database = await pool.query(
    "SELECT current_database() AS db",
  );

  console.log(
    `AI Worker connected to database: ${database.rows[0]?.db}`,
  );

  console.log("FPC-54 AI Worker started");

  let stopping = false;

  process.on("SIGINT", () => {
    stopping = true;
  });

  process.on("SIGTERM", () => {
    stopping = true;
  });

  let lastRecoveryAt = 0;

  try {
    while (!stopping) {
      const now = Date.now();

      if (now - lastRecoveryAt >= RECOVERY_INTERVAL_MS) {
        const recovered = await recoverStaleAiJobs(10);

        if (recovered > 0) {
          console.log(`Recovered ${recovered} stale AI jobs`);
        }

        lastRecoveryAt = now;
      }

      const job = await claimNextAiJob();

      if (job) {
        console.log(`Processing AI Job ${job.id}`);

        try {
          await processAiJob(job);
          console.log(`Completed AI Job ${job.id}`);
        } catch (error) {
          console.error(
            `AI Job ${job.id} failed`,
            error,
          );

          await failAiJob(job, error);
        }
      } else {
        await Bun.sleep(POLL_INTERVAL_MS);
      }
    }
  } finally {
    await pool.end();
    console.log("FPC-54 AI Worker stopped");
  }
}

main().catch((error) => {
  console.error("AI Worker fatal error:", error);
  process.exitCode = 1;
});
