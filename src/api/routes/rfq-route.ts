import { Router } from "express";
import * as rfqController from "../controller/rfq-controller";
import * as quotationController from "../controller/quotation-controller";
import { authenticate, authorize } from "../middlewares";

const router = Router();

router.use(authenticate);

// RFQs are managed by Purchase (FRD §17); everyone may read.
router.post("/", authorize("Purchase"), rfqController.createRfq);
router.get("/", rfqController.listRfqs);
router.get("/:id", rfqController.getRfq);
router.patch("/:id", authorize("Purchase"), rfqController.updateRfq);
router.post("/:id/send", authorize("Purchase"), rfqController.sendRfq);
router.delete("/:id", authorize("Purchase"), rfqController.deleteRfq);

// Quotations against an RFQ.
router.post(
  "/:id/quotations",
  authorize("Purchase"),
  quotationController.createQuotation
);
router.get("/:id/quotations", quotationController.listQuotations);
router.get(
  "/:id/comparison",
  authorize("Purchase", "Commercial"),
  quotationController.compareQuotations
);

export const rfqRoutes = router;
