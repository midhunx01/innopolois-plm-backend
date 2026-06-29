import type { NextFunction, Request, Response } from "express";
import * as repository from "../../repository";
import * as service from "../../service";
import type { SupplierFilters } from "../../repository";
import type { SupplierStatus } from "../../db/schema";
import { ValidationError } from "../../util/error";
import { ApiResponse } from "../../util/global/response";
import { parsePagination } from "../../util/types/pagination-types";
import { ValidateRequest } from "../../util/validator";
import { UuidString } from "../dto/global-req-dto";
import { CreateSupplierDto, UpdateSupplierDto } from "../dto/supplier-req-dto";

const supplierRepo = repository.supplierRepo;
const supplierService = service.supplierService;

export const createSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = ValidateRequest(req.body, CreateSupplierDto);
    if (!validation.valid) throw new ValidationError(validation.error);
    const result = await supplierService.create(validation.data, supplierRepo);
    ApiResponse.success(res, 201, "Vendor created", result);
  } catch (error) {
    next(error);
  }
};

export const listSuppliers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, pageSize } = parsePagination(req.query);
    const q = req.query;

    const filters: SupplierFilters = {
      page,
      pageSize,
      search: typeof q.search === "string" ? q.search : undefined,
      status:
        typeof q.status === "string" ? (q.status as SupplierStatus) : undefined,
      country: typeof q.country === "string" ? q.country : undefined,
      region: typeof q.region === "string" ? q.region : undefined,
      category: typeof q.category === "string" ? q.category : undefined,
      approved:
        q.approved === undefined ? undefined : q.approved === "true",
      tier: q.tier !== undefined ? Number(q.tier) : undefined,
    };

    const { rows, total } = await supplierService.list(filters, supplierRepo);
    ApiResponse.paginated(res, "Vendors retrieved", rows, {
      page,
      pageSize,
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const getSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await supplierService.getById(idValidation.data, supplierRepo);
    ApiResponse.success(res, 200, "Vendor retrieved", result);
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const bodyValidation = ValidateRequest(req.body, UpdateSupplierDto);
    if (!bodyValidation.valid) throw new ValidationError(bodyValidation.error);
    const result = await supplierService.update(
      idValidation.data,
      bodyValidation.data,
      supplierRepo
    );
    ApiResponse.success(res, 200, "Vendor updated", result);
  } catch (error) {
    next(error);
  }
};

export const deleteSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await supplierService.remove(idValidation.data, supplierRepo);
    ApiResponse.success(res, 200, "Vendor deleted", result);
  } catch (error) {
    next(error);
  }
};
