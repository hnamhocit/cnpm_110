import { Hono } from "hono";
import {
  handleDeleteExhibition,
  handleGetExhibitionStatus,
  handleGetPublicExhibitionDetail,
  handleGetPublicExhibitionImage,
  handleListPublicExhibitions,
  handleProcessExhibitionImage,
  handleUpdateExhibitionStatus,
} from "../controllers/exhibition.controller";
import { authenticate, requirePermission, type AuthEnv } from "../middlewares/auth";

const exhibitions = new Hono<AuthEnv>();

// Public gallery (CR-03: published content needs no JWT). Only watermarked WebP previews are served.
exhibitions.get("/", handleListPublicExhibitions);
exhibitions.get("/:id", handleGetPublicExhibitionDetail);
exhibitions.get("/:id/image", handleGetPublicExhibitionImage);

// Organizer management; ownership is enforced per contest in the service.
// POST /exhibitions/:id/process
exhibitions.post("/:id/process", authenticate, requirePermission("contests:update"), handleProcessExhibitionImage);
exhibitions.get("/:id/status", authenticate, requirePermission("contests:update"), handleGetExhibitionStatus);
exhibitions.patch("/:id", authenticate, requirePermission("contests:update"), handleUpdateExhibitionStatus);
exhibitions.delete("/:id", authenticate, requirePermission("contests:update"), handleDeleteExhibition);

export default exhibitions;
