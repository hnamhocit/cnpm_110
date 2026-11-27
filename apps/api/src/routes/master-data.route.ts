import { Hono } from "hono";
import {
  handleCreateCamera,
  handleCreateFilmLab,
  handleCreateFilmStock,
  handleCreateLens,
  handleDeleteCamera,
  handleDeleteFilmLab,
  handleDeleteFilmStock,
  handleDeleteLens,
  handleGetCamera,
  handleGetFilmLab,
  handleGetFilmStock,
  handleGetLens,
  handleListCameras,
  handleListFilmLabs,
  handleListFilmStocks,
  handleListLenses,
  handleRestoreCamera,
  handleRestoreFilmLab,
  handleRestoreFilmStock,
  handleRestoreLens,
  handleUpdateCamera,
  handleUpdateFilmLab,
  handleUpdateFilmStock,
  handleUpdateLens,
} from "../controllers/master-data.controller";
import {
  authenticate,
  requirePermission,
  type AuthEnv,
} from "../middlewares/auth";

const masterData = new Hono<AuthEnv>();

// Film Stocks (UC-06)
masterData.get("/film-stocks", handleListFilmStocks);
masterData.get("/film-stocks/:id", handleGetFilmStock);
masterData.post(
  "/film-stocks",
  authenticate,
  requirePermission("master-data:manage"),
  handleCreateFilmStock,
);
masterData.patch(
  "/film-stocks/:id",
  authenticate,
  requirePermission("master-data:manage"),
  handleUpdateFilmStock,
);
masterData.delete(
  "/film-stocks/:id",
  authenticate,
  requirePermission("master-data:manage"),
  handleDeleteFilmStock,
);
masterData.post(
  "/film-stocks/:id/restore",
  authenticate,
  requirePermission("master-data:manage"),
  handleRestoreFilmStock,
);

// Cameras (UC-07)
masterData.get("/cameras", handleListCameras);
masterData.get("/cameras/:id", handleGetCamera);
masterData.post(
  "/cameras",
  authenticate,
  requirePermission("master-data:manage"),
  handleCreateCamera,
);
masterData.patch(
  "/cameras/:id",
  authenticate,
  requirePermission("master-data:manage"),
  handleUpdateCamera,
);
masterData.delete(
  "/cameras/:id",
  authenticate,
  requirePermission("master-data:manage"),
  handleDeleteCamera,
);
masterData.post(
  "/cameras/:id/restore",
  authenticate,
  requirePermission("master-data:manage"),
  handleRestoreCamera,
);

// Lenses (UC-07)
masterData.get("/lenses", handleListLenses);
masterData.get("/lenses/:id", handleGetLens);
masterData.post(
  "/lenses",
  authenticate,
  requirePermission("master-data:manage"),
  handleCreateLens,
);
masterData.patch(
  "/lenses/:id",
  authenticate,
  requirePermission("master-data:manage"),
  handleUpdateLens,
);
masterData.delete(
  "/lenses/:id",
  authenticate,
  requirePermission("master-data:manage"),
  handleDeleteLens,
);
masterData.post(
  "/lenses/:id/restore",
  authenticate,
  requirePermission("master-data:manage"),
  handleRestoreLens,
);

// Film Labs (UC-08)
masterData.get("/film-labs", handleListFilmLabs);
masterData.get("/film-labs/:id", handleGetFilmLab);
masterData.post(
  "/film-labs",
  authenticate,
  requirePermission("master-data:manage"),
  handleCreateFilmLab,
);
masterData.patch(
  "/film-labs/:id",
  authenticate,
  requirePermission("master-data:manage"),
  handleUpdateFilmLab,
);
masterData.delete(
  "/film-labs/:id",
  authenticate,
  requirePermission("master-data:manage"),
  handleDeleteFilmLab,
);
masterData.post(
  "/film-labs/:id/restore",
  authenticate,
  requirePermission("master-data:manage"),
  handleRestoreFilmLab,
);

export default masterData;
