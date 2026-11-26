import { Hono } from "hono";
import { authenticate, requirePermission, type AuthEnv } from "../middlewares/auth";
import { assignRoundJudge, listJudgingRounds, listRoundJudges, saveJudgingRound, startJudgingRound, type RoundConfig } from "../services/judging-rounds";
import { requiredText } from "../controllers/contest-configuration.input";
import { AppError } from "../utils/errors";

const route = new Hono<AuthEnv>();
route.use("*", authenticate, requirePermission("contests:update"));

function id(value: unknown) {
  if (typeof value !== "string" || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)) {
    throw AppError.badRequest("Invalid resource ID");
  }
  return value;
}

async function body(request: { json: () => Promise<unknown> }) {
  const value = await request.json().catch(() => null);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw AppError.badRequest("Invalid JSON body");
  return value as Record<string, unknown>;
}

function roundFields(value: Record<string, unknown>) {
  const input: Partial<RoundConfig> = {};
  if (value.name !== undefined) input.name = requiredText(value.name, "round name", 150);
  for (const key of ["position", "advanceCount", "requiredJudges"] as const) {
    const field = value[key];
    if (field === undefined) continue;
    if (key === "advanceCount" && field === null) {
      input.advanceCount = null;
    } else if (typeof field === "number" && Number.isInteger(field) && field > 0 && field <= 2_147_483_647) {
      input[key] = field;
    } else {
      throw AppError.badRequest(`Invalid ${key}`);
    }
  }
  for (const key of ["startAt", "deadlineAt"] as const) {
    const field = value[key];
    if (field === undefined) continue;
    if (typeof field !== "string" || !/T.*(?:Z|[+-]\d\d:\d\d)$/.test(field) || !Number.isFinite(Date.parse(field))) {
      throw AppError.badRequest(`MSG008: Invalid ${key}`);
    }
    input[key] = new Date(field);
  }
  if (!Object.keys(input).length) throw AppError.badRequest("Missing round fields");
  return input;
}

route.get("/", async (c) => c.ok(await listJudgingRounds(id(c.req.param("id")), c.get("user").id)));
route.post("/", async (c) => c.created(await saveJudgingRound(
  id(c.req.param("id")), c.get("user").id, roundFields(await body(c.req)),
)));
route.patch("/:roundId", async (c) => c.ok(await saveJudgingRound(
  id(c.req.param("id")), c.get("user").id, roundFields(await body(c.req)), id(c.req.param("roundId")),
)));
route.get("/:roundId/judges", async (c) => c.ok(await listRoundJudges(
  id(c.req.param("id")), c.get("user").id, id(c.req.param("roundId")),
)));
route.post("/:roundId/start", async (c) => c.ok(await startJudgingRound(
  id(c.req.param("id")), c.get("user").id, id(c.req.param("roundId")),
)));

export async function handleAssignRoundJudge(c: import("hono").Context<AuthEnv>) {
  const input = await body(c.req);
  return c.ok(await assignRoundJudge(
    id(c.req.param("id")), c.get("user").id, id(input.roundId), id(input.categoryId), id(input.judgeId),
  ));
}

export default route;
