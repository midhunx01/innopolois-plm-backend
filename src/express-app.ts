import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import { config } from "./config";
import { HandleErrorWithLogger } from "./util/error/handler";
import { authRoutes } from "./api/routes/auth-route";
import { userRoutes } from "./api/routes/user-route";
import { materialCategoryRoutes } from "./api/routes/material-category-route";
import { subtypeRoutes } from "./api/routes/subtype-route";
import { majorSpecRoutes } from "./api/routes/major-spec-route";
import { gradeRoutes } from "./api/routes/grade-route";
import { unitRoutes } from "./api/routes/unit-route";
import { supplierRoutes } from "./api/routes/supplier-route";
import { partRoutes } from "./api/routes/part-route";
import { projectRoutes } from "./api/routes/project-route";
import { projectBomRoutes } from "./api/routes/project-bom-route";
import { bomLineRoutes } from "./api/routes/bom-line-route";
import { rfqRoutes } from "./api/routes/rfq-route";
import { quotationRoutes } from "./api/routes/quotation-route";
import { purchaseOrderRoutes } from "./api/routes/purchase-order-route";
import { warehouseRoutes } from "./api/routes/warehouse-route";
import { inventoryRoutes } from "./api/routes/inventory-route";
import { reportRoutes } from "./api/routes/report-route";

export const ExpressApp = async () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Turn body-parser's malformed-JSON SyntaxError into a clean 400.
  app.use(
    (err: any, _req: Request, res: Response, next: NextFunction) => {
      if (err?.type === "entity.parse.failed") {
        return res
          .status(400)
          .json({ success: false, error: "Invalid JSON in request body" });
      }
      next(err);
    }
  );

  app.use("/health", (_req: Request, res: Response, _next: NextFunction) => {
    res.status(200).json({ message: "OK" });
  });

  // Password-change gate: a user holding a restricted (must_change) token may
  // only reach the allow-listed paths until they set a new password. Everything
  // else returns 403 PASSWORD_CHANGE_REQUIRED so the UI can force the change.
  const PW_CHANGE_ALLOW = new Set([
    "/api/auth/login",
    "/api/auth/set-password",
    "/api/auth/me",
    "/health",
  ]);
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (PW_CHANGE_ALLOW.has(req.path)) return next();
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) return next();
    try {
      const decoded = jwt.verify(
        header.slice("Bearer ".length).trim(),
        config.auth.jwtSecret
      ) as { must_change?: boolean };
      if (decoded.must_change) {
        return res.status(403).json({
          success: false,
          error: "Password change required. Set a new password to continue.",
          code: "PASSWORD_CHANGE_REQUIRED",
        });
      }
    } catch {
      // Invalid/expired token — let the per-route authenticate produce the 401.
    }
    next();
  });

  // ── Auth + User management (FRD §17) ──────────────────────────────────────
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);

  // ── Module 1: Material Master (FRD §3–6) ──────────────────────────────────
  app.use("/api/material-categories", materialCategoryRoutes);
  app.use("/api/subtypes", subtypeRoutes);
  app.use("/api/major-specs", majorSpecRoutes);
  app.use("/api/grades", gradeRoutes);
  app.use("/api/units", unitRoutes);
  app.use("/api/parts", partRoutes);

  // ── Module 3: Vendor Database (FRD §7) ────────────────────────────────────
  app.use("/api/suppliers", supplierRoutes);

  // ── Module 2: Project BOM (FRD §8–10) ─────────────────────────────────────
  app.use("/api/projects", projectRoutes);
  app.use("/api/project-boms", projectBomRoutes);
  app.use("/api/bom-lines", bomLineRoutes);

  // ── Module 4: Procurement (FRD §11–14) ────────────────────────────────────
  app.use("/api/rfqs", rfqRoutes);
  app.use("/api/quotations", quotationRoutes);
  app.use("/api/purchase-orders", purchaseOrderRoutes);

  // ── Module 5: Inventory (FRD §14) ─────────────────────────────────────────
  app.use("/api/warehouses", warehouseRoutes);
  app.use("/api/inventory", inventoryRoutes);

  // ── Module 6: Reports & Analytics (FRD §15) ───────────────────────────────
  app.use("/api/reports", reportRoutes);

  app.use(HandleErrorWithLogger);

  return app;
};
