import { Router } from "express";
import * as authController from "../controller/auth-controller";
import { authenticate } from "../middlewares";

const router = Router();

// Public — issues a JWT.
router.post("/login", authController.login);

// Authenticated — current user profile.
router.get("/me", authenticate, authController.me);
// Forced first-login password change (works only while flagged must_change).
router.post("/set-password", authenticate, authController.setPassword);

export const authRoutes = router;
