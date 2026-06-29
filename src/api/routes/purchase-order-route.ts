import { Router } from "express";
import * as poController from "../controller/purchase-order-controller";
import { authenticate, authorize } from "../middlewares";

const router = Router();

router.use(authenticate);

// POs are managed by Purchase; goods receipt by Stores (FRD §17).
router.post("/", authorize("Purchase"), poController.createPo);
router.get("/", poController.listPos);
router.get("/:id", poController.getPo);
router.post("/:id/status", authorize("Purchase"), poController.updatePoStatus);
router.post("/:id/receive", authorize("Purchase", "Stores"), poController.receivePo);
router.delete("/:id", authorize("Purchase"), poController.deletePo);

export const purchaseOrderRoutes = router;
