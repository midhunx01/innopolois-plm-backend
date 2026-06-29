import { Router } from "express";
import * as supplierController from "../controller/supplier-controller";
import { authenticate, authorize } from "../middlewares";

const router = Router();

router.use(authenticate);

// Vendor master is maintained by Purchase (FRD §17); everyone may read.
router.post("/", authorize("Purchase"), supplierController.createSupplier);
router.get("/", supplierController.listSuppliers);
router.get("/:id", supplierController.getSupplier);
router.patch("/:id", authorize("Purchase"), supplierController.updateSupplier);
router.delete("/:id", authorize("Purchase"), supplierController.deleteSupplier);

export const supplierRoutes = router;
