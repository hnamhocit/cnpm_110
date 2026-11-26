import { Hono } from "hono";
import judgingRounds, { handleAssignRoundJudge } from "./judging-rounds.route";
import { generateContestAnalytics, getContestAnalytics } from "../services/contest-analytics";
import { AppError } from "../utils/errors";
import {
  handleArchiveContest,
  handleListContestExhibitions,
} from "../controllers/exhibition.controller";
import {
  handleCategoryCriteria,
  handlePublishContestResults,
  handleCreateCategory,
  handleDuplicateContest,
  handleUpdateCategory,
  handleCreateContest,
  handleDeleteContest,
  handleGetContest,
  handleGetContestCategories,
  handleGetContestResults,
  handleGetContestScoreboard,
  handleGetMyContestResults,
  handleListContests,
  handleUpdateContest,
} from "../controllers/contest.controller";
import {
  authenticate,
  requirePermission,
  type AuthEnv,
} from "../middlewares/auth";

const contests = new Hono<AuthEnv>();

contests.route("/:id/rounds", judgingRounds);
contests.post("/:id/judges", authenticate, requirePermission("contests:update"), handleAssignRoundJudge);

contests.get("/", handleListContests);
contests.get("/:id", handleGetContest);
contests.get("/:id/categories", handleGetContestCategories);
contests.get("/:id/results", handleGetContestResults);
contests.get("/:id/my-results", authenticate, requirePermission("submissions:read_own"), handleGetMyContestResults);
contests.post("/:id/publish-results", authenticate, requirePermission("contests:update"), handlePublishContestResults);
contests.post("/:id/archive", authenticate, requirePermission("contests:update"), handleArchiveContest);
contests.get("/:id/exhibitions", authenticate, requirePermission("contests:update"), handleListContestExhibitions);
contests.get(
  "/:id/scoreboard",
  authenticate,
  requirePermission("judging:read_scoreboard"),
  handleGetContestScoreboard,
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
  "/:id/duplicate",
  authenticate,
  requirePermission("contests:create"),
  handleDuplicateContest,
);
contests.post(
  "/:id/categories",
  authenticate,
  requirePermission("contests:update"),
  handleCreateCategory,
);
contests.on(
  ["PATCH", "DELETE"],
  "/:id/categories/:categoryId",
  authenticate,
  requirePermission("contests:update"),
  handleUpdateCategory,
);
contests.on(
  ["GET", "PUT"],
  "/:id/categories/:categoryId/criteria",
  authenticate,
  requirePermission("contests:update"),
  handleCategoryCriteria,
  handlePublishContestResults,
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
