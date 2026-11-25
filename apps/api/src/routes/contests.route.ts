import { Hono } from "hono";
import {
  handleCreateContest,
  handleDeleteContest,
  handleGetContest,
  handleGetContestCategories,
  handleGetContestResults,
  handleGetContestScoreboard,
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
