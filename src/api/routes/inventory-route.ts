import { Router } from "express";
import * as inventoryController from "../controller/inventory-controller";
import { authenticate, authorize } from "../middlewares";

const router = Router();

router.use(authenticate);

// Reads — open to any authenticated user.
router.get("/", inventoryController.listStock);
router.get("/movements", inventoryController.listMovements);
router.get("/alerts", inventoryController.lowStockAlerts);

// Stock operations — Stores (FRD §17: update inventory, stock transfers).
router.post("/opening", authorize("Stores"), inventoryController.openingStock);
router.post("/adjust", authorize("Stores"), inventoryController.adjustStock);
router.post("/transfer", authorize("Stores"), inventoryController.transferStock);

export const inventoryRoutes = router;
