import type { NextFunction, Request, Response } from "express";
import * as repository from "../../repository";
import * as service from "../../service";
import { ValidationError } from "../../util/error";
import { ApiResponse } from "../../util/global/response";
import { ValidateRequest } from "../../util/validator";
import { UuidString } from "../dto/global-req-dto";
import {
  CreateMajorSpecDto,
  UpdateMajorSpecDto,
} from "../dto/major-spec-req-dto";

const majorSpecRepo = repository.majorSpecRepo;
const majorSpecService = service.majorSpecService;

export const createMajorSpec = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = ValidateRequest(req.body, CreateMajorSpecDto);
    if (!validation.valid) throw new ValidationError(validation.error);
    const result = await majorSpecService.create(validation.data, majorSpecRepo);
    ApiResponse.success(res, 201, "Major spec created", result);
  } catch (error) {
    next(error);
  }
};

export const listMajorSpecs = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await majorSpecService.list(majorSpecRepo);
    ApiResponse.success(res, 200, "Major specs retrieved", result);
  } catch (error) {
    next(error);
  }
};

export const getMajorSpec = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await majorSpecService.getById(idValidation.data, majorSpecRepo);
    ApiResponse.success(res, 200, "Major spec retrieved", result);
  } catch (error) {
    next(error);
  }
};

export const updateMajorSpec = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const bodyValidation = ValidateRequest(req.body, UpdateMajorSpecDto);
    if (!bodyValidation.valid) throw new ValidationError(bodyValidation.error);
    const result = await majorSpecService.update(
      idValidation.data,
      bodyValidation.data,
      majorSpecRepo
    );
    ApiResponse.success(res, 200, "Major spec updated", result);
  } catch (error) {
    next(error);
  }
};

export const deleteMajorSpec = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await majorSpecService.remove(idValidation.data, majorSpecRepo);
    ApiResponse.success(res, 200, "Major spec deleted", result);
  } catch (error) {
    next(error);
  }
};
