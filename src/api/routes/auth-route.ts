import { Router } from "express";
import * as authController from "../controller/auth-controller";
import { authenticate } from "../middlewares";

const router = Router();

// Public — issues a JWT.
router.post("/login", authController.login);

// Authenticated — current user profile.
router.get("/me", authenticate, authController.me);

export const authRoutes = router;
