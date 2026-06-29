import { Router } from "express";
import * as partController from "../controller/part-controller";
import { authenticate, authorize } from "../middlewares";

const router = Router();

router.use(authenticate);

// Materials are created/edited by Engineering (FRD §17); everyone may read.
router.post("/", authorize("Engineering"), partController.createPart);
router.get("/", partController.listParts);
router.get("/:id", partController.getPart);
router.patch("/:id", authorize("Engineering"), partController.updatePart);
router.delete("/:id", authorize("Engineering"), partController.deletePart);

export const partRoutes = router;
