import type { NextFunction, Request, Response } from "express";
import * as repository from "../../repository";
import * as service from "../../service";
import { ValidationError } from "../../util/error";
import { ApiResponse } from "../../util/global/response";
import { ValidateRequest } from "../../util/validator";
import { UuidString } from "../dto/global-req-dto";
import { CreateSubtypeDto, UpdateSubtypeDto } from "../dto/subtype-req-dto";

const subtypeRepo = repository.subtypeRepo;
const categoryRepo = repository.materialCategoryRepo;
const subtypeService = service.subtypeService;

export const createSubtype = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = ValidateRequest(req.body, CreateSubtypeDto);
    if (!validation.valid) throw new ValidationError(validation.error);
    const result = await subtypeService.create(
      validation.data,
      subtypeRepo,
      categoryRepo
    );
    ApiResponse.success(res, 201, "Subtype created", result);
  } catch (error) {
    next(error);
  }
};

// GET /api/material-categories/:categoryId/subtypes
export const listSubtypesByCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.categoryId, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await subtypeService.listByCategory(
      idValidation.data,
      subtypeRepo,
      categoryRepo
    );
    ApiResponse.success(res, 200, "Subtypes retrieved", result);
  } catch (error) {
    next(error);
  }
};

export const getSubtype = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await subtypeService.getById(idValidation.data, subtypeRepo);
    ApiResponse.success(res, 200, "Subtype retrieved", result);
  } catch (error) {
    next(error);
  }
};

export const updateSubtype = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const bodyValidation = ValidateRequest(req.body, UpdateSubtypeDto);
    if (!bodyValidation.valid) throw new ValidationError(bodyValidation.error);
    const result = await subtypeService.update(
      idValidation.data,
      bodyValidation.data,
      subtypeRepo
    );
    ApiResponse.success(res, 200, "Subtype updated", result);
  } catch (error) {
    next(error);
  }
};

export const deleteSubtype = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await subtypeService.remove(idValidation.data, subtypeRepo);
    ApiResponse.success(res, 200, "Subtype deleted", result);
  } catch (error) {
    next(error);
  }
};
