import type { NextFunction, Request, Response } from "express";
import * as repository from "../../repository";
import * as service from "../../service";
import { ApiResponse } from "../../util/global/response";

const reportRepo = repository.reportRepo;
const reportService = service.reportService;

const handler =
  (fn: () => Promise<unknown>, message: string) =>
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await fn();
      ApiResponse.success(res, 200, message, result);
    } catch (error) {
      next(error);
    }
  };

export const dashboard = handler(
  () => reportService.dashboard(reportRepo),
  "Dashboard KPIs"
);
export const purchaseValue = handler(
  () => reportService.purchaseValue(reportRepo),
  "Purchase value by status"
);
export const vendorPerformance = handler(
  () => reportService.vendorPerformance(reportRepo),
  "Vendor performance"
);
export const stockValue = handler(
  () => reportService.stockValue(reportRepo),
  "Stock value by warehouse"
);
export const vendorSpend = handler(
  () => reportService.vendorSpend(reportRepo),
  "Vendor-wise spend"
);
export const projectCost = handler(
  () => reportService.projectCost(reportRepo),
  "Project cost"
);
