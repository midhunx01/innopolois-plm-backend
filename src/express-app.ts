import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import helmet from "helmet";
import { HandleErrorWithLogger } from "./util/error/handler";
import { httpLogger } from "./util/logger";
import { authRoutes } from "./api/routes/auth-route";
import { materialCategoryRoutes } from "./api/routes/material-category-route";
import { subtypeRoutes } from "./api/routes/subtype-route";
import { majorSpecRoutes } from "./api/routes/major-spec-route";
import { gradeRoutes } from "./api/routes/grade-route";
import { unitRoutes } from "./api/routes/unit-route";
import { partRoutes } from "./api/routes/part-route";

export const ExpressApp = async () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(httpLogger);

  app.use("/health", (_req: Request, res: Response, _next: NextFunction) => {
    res.status(200).json({ message: "OK" });
  });

  // ── Module 1: Material Master (FRD §3–6) ──────────────────────────────────
  app.use("/api/auth", authRoutes);
  app.use("/api/material-categories", materialCategoryRoutes);
  app.use("/api/subtypes", subtypeRoutes);
  app.use("/api/major-specs", majorSpecRoutes);
  app.use("/api/grades", gradeRoutes);
  app.use("/api/units", unitRoutes);
  app.use("/api/parts", partRoutes);

  app.use(HandleErrorWithLogger);

  return app;
};
