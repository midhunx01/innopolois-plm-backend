import type { NextFunction, Request, Response } from "express";
import * as repository from "../../repository";
import * as service from "../../service";
import type { MovementFilters, StockFilters } from "../../repository";
import type { Availability, StockMovementType } from "../../db/schema";
import { AuthenticationError, ValidationError } from "../../util/error";
import { ApiResponse } from "../../util/global/response";
import { parsePagination } from "../../util/types/pagination-types";
import { ValidateRequest } from "../../util/validator";
import {
  AdjustStockDto,
  OpeningStockDto,
  TransferStockDto,
} from "../dto/inventory-req-dto";

const inventoryService = service.inventoryService;

const deps: service.InventoryServiceDeps = {
  stockBalanceRepo: repository.stockBalanceRepo,
  stockMovementRepo: repository.stockMovementRepo,
  warehouseRepo: repository.warehouseRepo,
  partRepo: repository.partRepo,
};

// GET /api/inventory — stock balances (InventoryRecord list).
export const listStock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, pageSize } = parsePagination(req.query);
    const q = req.query;
    const filters: StockFilters = {
      page,
      pageSize,
      search: typeof q.search === "string" ? q.search : undefined,
      warehouseId: typeof q.warehouseId === "string" ? q.warehouseId : undefined,
      partId: typeof q.partId === "string" ? q.partId : undefined,
      status: typeof q.status === "string" ? (q.status as Availability) : undefined,
      lowStock: q.lowStock === "true",
    };
    const { rows, total } = await inventoryService.listBalances(filters, deps);
    ApiResponse.paginated(res, "Stock balances retrieved", rows, {
      page,
      pageSize,
      total,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/inventory/movements — the stock ledger.
export const listMovements = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, pageSize } = parsePagination(req.query);
    const q = req.query;
    const filters: MovementFilters = {
      page,
      pageSize,
      partId: typeof q.partId === "string" ? q.partId : undefined,
      warehouseId: typeof q.warehouseId === "string" ? q.warehouseId : undefined,
      type: typeof q.type === "string" ? (q.type as StockMovementType) : undefined,
    };
    const { rows, total } = await inventoryService.listMovements(filters, deps);
    ApiResponse.paginated(res, "Stock movements retrieved", rows, {
      page,
      pageSize,
      total,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/inventory/alerts — items at or below reorder point.
export const lowStockAlerts = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await inventoryService.lowStockAlerts(deps);
    ApiResponse.success(res, 200, "Low-stock alerts", result);
  } catch (error) {
    next(error);
  }
};

export const openingStock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = ValidateRequest(req.body, OpeningStockDto);
    if (!validation.valid) throw new ValidationError(validation.error);
    if (!req.auth) throw new AuthenticationError("Authentication required");
    const result = await inventoryService.openingStock(
      validation.data,
      req.auth.id,
      deps
    );
    ApiResponse.success(res, 201, "Opening stock posted", result);
  } catch (error) {
    next(error);
  }
};

export const adjustStock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = ValidateRequest(req.body, AdjustStockDto);
    if (!validation.valid) throw new ValidationError(validation.error);
    if (!req.auth) throw new AuthenticationError("Authentication required");
    const result = await inventoryService.adjustStock(
      validation.data,
      req.auth.id,
      deps
    );
    ApiResponse.success(res, 201, "Stock adjusted", result);
  } catch (error) {
    next(error);
  }
};

export const transferStock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = ValidateRequest(req.body, TransferStockDto);
    if (!validation.valid) throw new ValidationError(validation.error);
    if (!req.auth) throw new AuthenticationError("Authentication required");
    const result = await inventoryService.transferStock(
      validation.data,
      req.auth.id,
      deps
    );
    ApiResponse.success(res, 201, "Stock transferred", result);
  } catch (error) {
    next(error);
  }
};
