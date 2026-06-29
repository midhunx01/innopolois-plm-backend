import { Router } from "express";
import * as subtypeController from "../controller/subtype-controller";
import { authenticate, authorize } from "../middlewares";

const router = Router();

router.use(authenticate);

// Writes are admin-only (master data); reads via the nested category route.
router.post("/", authorize("Administrator"), subtypeController.createSubtype);
router.get("/:id", subtypeController.getSubtype);
router.patch("/:id", authorize("Administrator"), subtypeController.updateSubtype);
router.delete("/:id", authorize("Administrator"), subtypeController.deleteSubtype);

export const subtypeRoutes = router;
