import { Router } from "express";
import * as unitController from "../controller/unit-controller";
import { authenticate, authorize } from "../middlewares";

const router = Router();

router.use(authenticate);

router.post("/", authorize("Administrator"), unitController.createUnit);
router.get("/", unitController.listUnits);
router.get("/:id", unitController.getUnit);
router.patch("/:id", authorize("Administrator"), unitController.updateUnit);
router.delete("/:id", authorize("Administrator"), unitController.deleteUnit);

export const unitRoutes = router;
