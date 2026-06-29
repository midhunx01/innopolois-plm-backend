import { Router } from "express";
import * as majorSpecController from "../controller/major-spec-controller";
import { authenticate, authorize } from "../middlewares";

const router = Router();

router.use(authenticate);

router.post("/", authorize("Administrator"), majorSpecController.createMajorSpec);
router.get("/", majorSpecController.listMajorSpecs);
router.get("/:id", majorSpecController.getMajorSpec);
router.patch("/:id", authorize("Administrator"), majorSpecController.updateMajorSpec);
router.delete("/:id", authorize("Administrator"), majorSpecController.deleteMajorSpec);

export const majorSpecRoutes = router;
