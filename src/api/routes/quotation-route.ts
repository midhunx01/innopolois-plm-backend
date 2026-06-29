import { Router } from "express";
import * as quotationController from "../controller/quotation-controller";
import { authenticate, authorize } from "../middlewares";

const router = Router();

router.use(authenticate);

router.get("/:id", quotationController.getQuotation);
// Awarding is a commercial/purchase decision (FRD §13).
router.post(
  "/:id/award",
  authorize("Purchase", "Commercial"),
  quotationController.awardQuotation
);

export const quotationRoutes = router;
