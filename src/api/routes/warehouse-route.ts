import { Router } from "express";
import * as warehouseController from "../controller/warehouse-controller";
import { authenticate, authorize } from "../middlewares";

const router = Router();

router.use(authenticate);

// Warehouses are maintained by Stores (FRD §17); everyone may read.
router.post("/", authorize("Stores"), warehouseController.createWarehouse);
router.get("/", warehouseController.listWarehouses);
router.get("/:id", warehouseController.getWarehouse);
router.patch("/:id", authorize("Stores"), warehouseController.updateWarehouse);
router.delete("/:id", authorize("Stores"), warehouseController.deleteWarehouse);

export const warehouseRoutes = router;
