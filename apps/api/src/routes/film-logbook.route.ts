import { Hono } from "hono";
import {
  handleCreateFilmRoll,
  handleCreateRollFrame,
  handleDeleteFilmRoll,
  handleDeleteRollFrame,
  handleGetFilmRoll,
  handleListFilmRolls,
  handleListRollFrames,
  handleUpdateFilmRoll,
  handleUpdateRollFrame,
} from "../controllers/film-logbook.controller";
import {
  authenticate,
  requirePermission,
  type AuthEnv,
} from "../middlewares/auth";

const filmLogbook = new Hono<AuthEnv>();

filmLogbook.use("*", authenticate, requirePermission("film-rolls:manage"));

// UC-35: Film Rolls
filmLogbook.get("/", handleListFilmRolls);
filmLogbook.post("/", handleCreateFilmRoll);
filmLogbook.get("/:id", handleGetFilmRoll);
filmLogbook.patch("/:id", handleUpdateFilmRoll);
filmLogbook.delete("/:id", handleDeleteFilmRoll);

// UC-36: Frame Logs
filmLogbook.get("/:id/frames", handleListRollFrames);
filmLogbook.post("/:id/frames", handleCreateRollFrame);
filmLogbook.patch("/:id/frames/:frameId", handleUpdateRollFrame);
filmLogbook.delete("/:id/frames/:frameId", handleDeleteRollFrame);

export default filmLogbook;
