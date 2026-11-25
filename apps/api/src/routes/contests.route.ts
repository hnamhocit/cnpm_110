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
  requireRoles,
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
  requireRoles("Organizer"),
  handleGetContestScoreboard,
);
contests.post(
  "/",
  authenticate,
  requireRoles("Organizer"),
  handleCreateContest,
);
contests.put(
  "/:id",
  authenticate,
  requireRoles("Organizer"),
  handleUpdateContest,
);
contests.delete(
  "/:id",
  authenticate,
  requireRoles("Organizer"),
  handleDeleteContest,
);

export default contests;
