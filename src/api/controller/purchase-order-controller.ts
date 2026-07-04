import type { NextFunction, Request, Response } from "express";
import * as repository from "../../repository";
import * as service from "../../service";
import type { PoFilters } from "../../repository";
import type { PoStatus } from "../../db/schema";
import { AuthenticationError, ValidationError } from "../../util/error";
import { ApiResponse } from "../../util/global/response";
import { parsePagination } from "../../util/types/pagination-types";
import { ValidateRequest } from "../../util/validator";
import { UuidString } from "../dto/global-req-dto";
import {
  CreatePoDto,
  ReceivePoDto,
  UpdatePoStatusDto,
} from "../dto/purchase-order-req-dto";

const poRepo = repository.purchaseOrderRepo;
const poService = service.purchaseOrderService;

const deps: service.PurchaseOrderServiceDeps = {
  poRepo,
  poLineRepo: repository.poLineRepo,
  supplierRepo: repository.supplierRepo,
  quotationRepo: repository.quotationRepo,
  quotationLineRepo: repository.quotationLineRepo,
  rfqLineRepo: repository.rfqLineRepo,
  partRepo: repository.partRepo,
  partPriceHistoryRepo: repository.partPriceHistoryRepo,
  counterRepo: repository.counterRepo,
  stockBalanceRepo: repository.stockBalanceRepo,
  stockMovementRepo: repository.stockMovementRepo,
  warehouseRepo: repository.warehouseRepo,
};

export const createPo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = ValidateRequest(req.body, CreatePoDto);
    if (!validation.valid) throw new ValidationError(validation.error);
    if (!req.auth) throw new AuthenticationError("Authentication required");
    const result = await poService.create(validation.data, req.auth.id, deps);
    ApiResponse.success(res, 201, "Purchase order created", result);
  } catch (error) {
    next(error);
  }
};

export const listPos = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, pageSize } = parsePagination(req.query);
    const q = req.query;
    const filters: PoFilters = {
      page,
      pageSize,
      search: typeof q.search === "string" ? q.search : undefined,
      status: typeof q.status === "string" ? (q.status as PoStatus) : undefined,
      supplierId: typeof q.supplierId === "string" ? q.supplierId : undefined,
    };
    const { rows, total } = await poService.list(filters, poRepo);
    ApiResponse.paginated(res, "Purchase orders retrieved", rows, {
      page,
      pageSize,
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const getPo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await poService.getDetail(idValidation.data, deps);
    ApiResponse.success(res, 200, "Purchase order retrieved", result);
  } catch (error) {
    next(error);
  }
};

export const updatePoStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const bodyValidation = ValidateRequest(req.body, UpdatePoStatusDto);
    if (!bodyValidation.valid) throw new ValidationError(bodyValidation.error);
    const result = await poService.updateStatus(
      idValidation.data,
      bodyValidation.data,
      deps
    );
    ApiResponse.success(res, 200, "PO status updated", result);
  } catch (error) {
    next(error);
  }
};

export const receivePo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const bodyValidation = ValidateRequest(req.body, ReceivePoDto);
    if (!bodyValidation.valid) throw new ValidationError(bodyValidation.error);
    const result = await poService.receive(
      idValidation.data,
      bodyValidation.data,
      deps
    );
    ApiResponse.success(res, 200, "Goods receipt recorded", result);
  } catch (error) {
    next(error);
  }
};

export const deletePo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await poService.remove(idValidation.data, deps);
    ApiResponse.success(res, 200, "Purchase order deleted", result);
  } catch (error) {
    next(error);
  }
};
