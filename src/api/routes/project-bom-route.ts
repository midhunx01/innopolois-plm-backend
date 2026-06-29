import { Router } from "express";
import * as bomController from "../controller/project-bom-controller";
import * as lineController from "../controller/bom-line-controller";
import { authenticate, authorize } from "../middlewares";

const router = Router();

router.use(authenticate);

// BOM documents — Engineering authors; everyone may read.
router.post("/", authorize("Engineering"), bomController.createBom);
router.get("/", bomController.listBoms);
router.get("/:id", bomController.getBom);
router.patch("/:id", authorize("Engineering"), bomController.updateBom);
router.delete("/:id", authorize("Engineering"), bomController.deleteBom);

// Approval workflow (FRD §10). Open to any authenticated user; the service
// enforces which role may act at the BOM's current stage.
router.post("/:id/transition", bomController.transitionBom);

// BOM analysis / regrouping (FRD §11) — supplier / category / lead-time / cost.
router.get("/:id/analysis", bomController.analyzeBom);

// Nested BOM lines.
router.post("/:bomId/lines", authorize("Engineering"), lineController.addLine);
router.get("/:bomId/lines", lineController.listLines);

export const projectBomRoutes = router;
