import { Router } from "express";
import * as resourceSpecController from "../controller/resource-spec-controller";
import { authenticate, authorize } from "../middlewares";

const router = Router();

router.use(authenticate);

router.post("/", authorize("Administrator"), resourceSpecController.createResourceSpec);
router.get("/", resourceSpecController.listResourceSpecs);
router.get("/:id", resourceSpecController.getResourceSpec);
router.patch("/:id", authorize("Administrator"), resourceSpecController.updateResourceSpec);
router.delete("/:id", authorize("Administrator"), resourceSpecController.deleteResourceSpec);

export const resourceSpecRoutes = router;
