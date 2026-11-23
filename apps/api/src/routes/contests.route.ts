import { Hono } from "hono";
import {
  handleCreateContest,
  handleDeleteContest,
  handleGetContest,
  handleGetContestCategories,
  handleGetContestResults,
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

contests.post(
  "/",
  authenticate,
  requireRoles("Admin", "Organizer"),
  handleCreateContest,
);
contests.put(
  "/:id",
  authenticate,
  requireRoles("Admin", "Organizer"),
  handleUpdateContest,
);
contests.delete(
  "/:id",
  authenticate,
  requireRoles("Admin", "Organizer"),
  handleDeleteContest,
);

export default contests;
