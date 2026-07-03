import type { NextFunction, Request, Response } from "express";
import * as repository from "../../repository";
import * as service from "../../service";
import type { PartFilters } from "../../repository";
import type { Availability, Lifecycle, SourcingType } from "../../db/schema";
import { AuthenticationError, ValidationError } from "../../util/error";
import { ApiResponse } from "../../util/global/response";
import { parsePagination } from "../../util/types/pagination-types";
import { ValidateRequest } from "../../util/validator";
import { UuidString } from "../dto/global-req-dto";
import { CreatePartDto, UpdatePartDto } from "../dto/part-req-dto";

const partRepo = repository.partRepo;
const partService = service.partService;

const deps: service.PartServiceDeps = {
  partRepo,
  partVendorRepo: repository.partVendorRepo,
  categoryRepo: repository.materialCategoryRepo,
  subtypeRepo: repository.subtypeRepo,
  majorSpecRepo: repository.majorSpecRepo,
  gradeRepo: repository.gradeRepo,
  supplierRepo: repository.supplierRepo,
};

export const createPart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = ValidateRequest(req.body, CreatePartDto);
    if (!validation.valid) throw new ValidationError(validation.error);
    if (!req.auth) throw new AuthenticationError("Authentication required");
    const result = await partService.create(
      validation.data,
      req.auth.id,
      deps
    );
    ApiResponse.success(res, 201, "Material created", result);
  } catch (error) {
    next(error);
  }
};

export const listParts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, pageSize } = parsePagination(req.query);
    const q = req.query;

    const filters: PartFilters = {
      page,
      pageSize,
      search: typeof q.search === "string" ? q.search : undefined,
      categoryId: typeof q.categoryId === "string" ? q.categoryId : undefined,
      subtypeId: typeof q.subtypeId === "string" ? q.subtypeId : undefined,
      lifecycle:
        typeof q.lifecycle === "string"
          ? (q.lifecycle as Lifecycle)
          : undefined,
      availability:
        typeof q.availability === "string"
          ? (q.availability as Availability)
          : undefined,
      sourcing:
        typeof q.sourcing === "string"
          ? (q.sourcing as SourcingType)
          : undefined,
    };

    const { rows, total } = await partService.list(filters, partRepo);
    ApiResponse.paginated(res, "Materials retrieved", rows, {
      page,
      pageSize,
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const getPart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await partService.getById(idValidation.data, deps);
    ApiResponse.success(res, 200, "Material retrieved", result);
  } catch (error) {
    next(error);
  }
};

export const updatePart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const bodyValidation = ValidateRequest(req.body, UpdatePartDto);
    if (!bodyValidation.valid) throw new ValidationError(bodyValidation.error);
    const result = await partService.update(
      idValidation.data,
      bodyValidation.data,
      deps
    );
    ApiResponse.success(res, 200, "Material updated", result);
  } catch (error) {
    next(error);
  }
};

export const deletePart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await partService.remove(idValidation.data, partRepo);
    ApiResponse.success(res, 200, "Material deleted", result);
  } catch (error) {
    next(error);
  }
};
