import type { NextFunction, Request, Response } from "express";
import * as repository from "../../repository";
import * as service from "../../service";
import { ValidationError } from "../../util/error";
import { ApiResponse } from "../../util/global/response";
import { ValidateRequest } from "../../util/validator";
import { UuidString } from "../dto/global-req-dto";
import {
  CreateBomLineDto,
  SetRequiredDateDto,
  UpdateBomLineDto,
} from "../dto/bom-line-req-dto";

const bomLineService = service.bomLineService;

const deps: service.BomLineServiceDeps = {
  bomLineRepo: repository.bomLineRepo,
  projectBomRepo: repository.projectBomRepo,
  partRepo: repository.partRepo,
  partVendorRepo: repository.partVendorRepo,
  supplierRepo: repository.supplierRepo,
};

// POST /api/project-boms/:bomId/lines
export const addLine = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.bomId, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const validation = ValidateRequest(req.body, CreateBomLineDto);
    if (!validation.valid) throw new ValidationError(validation.error);
    const result = await bomLineService.add(idValidation.data, validation.data, deps);
    ApiResponse.success(res, 201, "BOM line added", result);
  } catch (error) {
    next(error);
  }
};

// GET /api/project-boms/:bomId/lines
export const listLines = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.bomId, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await bomLineService.listByBom(idValidation.data, deps);
    ApiResponse.success(res, 200, "BOM lines retrieved", result);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/bom-lines/:id
export const updateLine = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const bodyValidation = ValidateRequest(req.body, UpdateBomLineDto);
    if (!bodyValidation.valid) throw new ValidationError(bodyValidation.error);
    const result = await bomLineService.update(
      idValidation.data,
      bodyValidation.data,
      deps
    );
    ApiResponse.success(res, 200, "BOM line updated", result);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/bom-lines/:id/required-date — Project Manager sets the required-by
// date on a line (allowed at any BOM stage).
export const setLineRequiredDate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const bodyValidation = ValidateRequest(req.body, SetRequiredDateDto);
    if (!bodyValidation.valid) throw new ValidationError(bodyValidation.error);
    const result = await bomLineService.setRequiredDate(
      idValidation.data,
      bodyValidation.data.required_by_date,
      deps
    );
    ApiResponse.success(res, 200, "Required-by date updated", result);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/bom-lines/:id
export const deleteLine = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await bomLineService.remove(idValidation.data, deps);
    ApiResponse.success(res, 200, "BOM line removed", result);
  } catch (error) {
    next(error);
  }
};
