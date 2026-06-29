import { Router } from "express";
import * as reportController from "../controller/report-controller";
import { authenticate } from "../middlewares";

const router = Router();

// All reports require authentication; visible to any signed-in role (the UI
// surfaces role-relevant ones). Aggregations are read-only (FRD §15).
router.use(authenticate);

router.get("/dashboard", reportController.dashboard);
router.get("/procurement/purchase-value", reportController.purchaseValue);
router.get("/procurement/vendor-performance", reportController.vendorPerformance);
router.get("/inventory/stock-value", reportController.stockValue);
router.get("/commercial/vendor-spend", reportController.vendorSpend);
router.get("/commercial/project-cost", reportController.projectCost);

export const reportRoutes = router;
