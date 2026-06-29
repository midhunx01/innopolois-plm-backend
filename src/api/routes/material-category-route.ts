import { Router } from "express";
import * as categoryController from "../controller/material-category-controller";
import * as subtypeController from "../controller/subtype-controller";
import { authenticate, authorize } from "../middlewares";

const router = Router();

// All master endpoints require an authenticated user; writes are admin-only
// (FRD §6 — "Only administrators shall create or modify master data").
router.use(authenticate);

router.post("/", authorize("Administrator"), categoryController.createCategory);
router.get("/", categoryController.listCategories);
router.get("/:id", categoryController.getCategory);
router.patch("/:id", authorize("Administrator"), categoryController.updateCategory);
router.delete("/:id", authorize("Administrator"), categoryController.deleteCategory);

// Nested: subtypes belonging to a category.
router.get("/:categoryId/subtypes", subtypeController.listSubtypesByCategory);

export const materialCategoryRoutes = router;
