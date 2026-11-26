import { Hono } from "hono";
import { generateContestAnalytics, getContestAnalytics } from "../services/contest-analytics";
import { AppError } from "../utils/errors";
import {
  handleCloseJudgingRound,
  handleCreateContest,
  handleDeleteContest,
  handleGetContest,
  handleGetContestCategories,
  handleGetContestResults,
  handleGetContestScoreboard,
  handleGetJudgingProgress,
  handleListContests,
  handleUpdateContest,
} from "../controllers/contest.controller";
import {
  authenticate,
  requirePermission,
  type AuthEnv,
} from "../middlewares/auth";

const contests = new Hono<AuthEnv>();

contests.get("/", handleListContests);
contests.get("/:id", handleGetContest);
contests.get("/:id/categories", handleGetContestCategories);
contests.get("/:id/results", handleGetContestResults);
contests.get(
  "/:id/scoreboard",
  authenticate,
  requirePermission("judging:read_scoreboard"),
  handleGetContestScoreboard,
);
contests.get(
  "/:id/judging-progress",
  authenticate,
  requirePermission("judging:read_scoreboard"),
  handleGetJudgingProgress,
);
contests.post(
  "/:id/close-judging",
  authenticate,
  requirePermission("contests:update"),
  handleCloseJudgingRound,
);
contests.on(
  ["GET", "POST"],
  "/:id/analytics",
  authenticate,
  requirePermission("contests:read_analytics"),
  async (c) => {
    const contestId = c.req.param("id");
    if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(contestId)) {
      throw AppError.badRequest("Invalid contest ID");
    }
    const statistics = await getContestAnalytics(contestId, c.get("user").id);
    const report = c.req.method === "POST" ? await generateContestAnalytics(statistics) : null;
    return c.ok({ ...statistics, report });
  },
);
contests.post(
  "/",
  authenticate,
  requirePermission("contests:create"),
  handleCreateContest,
);
contests.put(
  "/:id",
  authenticate,
  requirePermission("contests:update"),
  handleUpdateContest,
);
contests.delete(
  "/:id",
  authenticate,
  requirePermission("contests:delete"),
  handleDeleteContest,
);

export default contests;
