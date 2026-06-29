import { Router } from "express";
import * as lineController from "../controller/bom-line-controller";
import { authenticate, authorize } from "../middlewares";

const router = Router();

router.use(authenticate);

// Individual BOM line edits (the BOM must be in Draft — enforced by the service).
router.patch("/:id", authorize("Engineering"), lineController.updateLine);
router.delete("/:id", authorize("Engineering"), lineController.deleteLine);

export const bomLineRoutes = router;
