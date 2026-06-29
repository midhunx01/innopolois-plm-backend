import type { NextFunction, Request, Response } from "express";
import * as repository from "../../repository";
import * as service from "../../service";
import { ValidationError } from "../../util/error";
import { ApiResponse } from "../../util/global/response";
import { ValidateRequest } from "../../util/validator";
import { UuidString } from "../dto/global-req-dto";
import { CreateUnitDto, UpdateUnitDto } from "../dto/unit-req-dto";

const unitRepo = repository.unitRepo;
const unitService = service.unitService;

export const createUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = ValidateRequest(req.body, CreateUnitDto);
    if (!validation.valid) throw new ValidationError(validation.error);
    const result = await unitService.create(validation.data, unitRepo);
    ApiResponse.success(res, 201, "Unit created", result);
  } catch (error) {
    next(error);
  }
};

export const listUnits = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await unitService.list(unitRepo);
    ApiResponse.success(res, 200, "Units retrieved", result);
  } catch (error) {
    next(error);
  }
};

export const getUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await unitService.getById(idValidation.data, unitRepo);
    ApiResponse.success(res, 200, "Unit retrieved", result);
  } catch (error) {
    next(error);
  }
};

export const updateUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const bodyValidation = ValidateRequest(req.body, UpdateUnitDto);
    if (!bodyValidation.valid) throw new ValidationError(bodyValidation.error);
    const result = await unitService.update(
      idValidation.data,
      bodyValidation.data,
      unitRepo
    );
    ApiResponse.success(res, 200, "Unit updated", result);
  } catch (error) {
    next(error);
  }
};

export const deleteUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await unitService.remove(idValidation.data, unitRepo);
    ApiResponse.success(res, 200, "Unit deleted", result);
  } catch (error) {
    next(error);
  }
};
