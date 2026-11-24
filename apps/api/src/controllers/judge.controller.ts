
import type { Context } from "hono";
import type { AuthEnv } from "../middlewares/auth";
import { getAssignedSubmissions } from "../services/judge.service";

export async function handleGetAssignedSubmissions(
  c: Context<AuthEnv>,
) {
  const judge = c.get("user");

  const submissions = await getAssignedSubmissions(judge.id);

  return c.ok(
    {
      items: submissions,
      total: submissions.length,
    },
    "Assigned submissions retrieved successfully",
  );
}
