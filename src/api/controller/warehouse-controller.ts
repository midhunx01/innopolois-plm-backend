import type { NextFunction, Request, Response } from "express";
import * as repository from "../../repository";
import * as service from "../../service";
import { ValidationError } from "../../util/error";
import { ApiResponse } from "../../util/global/response";
import { ValidateRequest } from "../../util/validator";
import { UuidString } from "../dto/global-req-dto";
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
} from "../dto/warehouse-req-dto";

const warehouseRepo = repository.warehouseRepo;
const warehouseService = service.warehouseService;

const deps: service.WarehouseServiceDeps = {
  warehouseRepo,
  stockBalanceRepo: repository.stockBalanceRepo,
};

export const createWarehouse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = ValidateRequest(req.body, CreateWarehouseDto);
    if (!validation.valid) throw new ValidationError(validation.error);
    const result = await warehouseService.create(validation.data, warehouseRepo);
    ApiResponse.success(res, 201, "Warehouse created", result);
  } catch (error) {
    next(error);
  }
};

export const listWarehouses = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await warehouseService.list(warehouseRepo);
    ApiResponse.success(res, 200, "Warehouses retrieved", result);
  } catch (error) {
    next(error);
  }
};

export const getWarehouse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await warehouseService.getDetail(idValidation.data, deps);
    ApiResponse.success(res, 200, "Warehouse retrieved", result);
  } catch (error) {
    next(error);
  }
};

export const updateWarehouse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const bodyValidation = ValidateRequest(req.body, UpdateWarehouseDto);
    if (!bodyValidation.valid) throw new ValidationError(bodyValidation.error);
    const result = await warehouseService.update(
      idValidation.data,
      bodyValidation.data,
      warehouseRepo
    );
    ApiResponse.success(res, 200, "Warehouse updated", result);
  } catch (error) {
    next(error);
  }
};

export const deleteWarehouse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await warehouseService.remove(idValidation.data, warehouseRepo);
    ApiResponse.success(res, 200, "Warehouse deleted", result);
  } catch (error) {
    next(error);
  }
};
