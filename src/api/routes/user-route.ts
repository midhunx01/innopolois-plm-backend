import { Router } from "express";
import * as userController from "../controller/user-controller";
import { authenticate, authorize } from "../middlewares";

const router = Router();

// User management is Administrator-only (FRD §17).
router.use(authenticate, authorize("Administrator"));

router.post("/", userController.createUser);
router.get("/", userController.listUsers);
router.get("/:id", userController.getUser);
router.patch("/:id", userController.updateUser);
router.post("/:id/reset-password", userController.resetPassword);
router.delete("/:id", userController.deleteUser);

export const userRoutes = router;
