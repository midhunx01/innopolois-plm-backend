import type { NextFunction, Request, Response } from "express";
import * as repository from "../../repository";
import * as service from "../../service";
import { ValidationError } from "../../util/error";
import { ApiResponse } from "../../util/global/response";
import { ValidateRequest } from "../../util/validator";
import { UuidString } from "../dto/global-req-dto";
import {
  CreateResourceSpecDto,
  UpdateResourceSpecDto,
} from "../dto/resource-spec-req-dto";

const resourceSpecRepo = repository.resourceSpecRepo;
const resourceSpecService = service.resourceSpecService;

export const createResourceSpec = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = ValidateRequest(req.body, CreateResourceSpecDto);
    if (!validation.valid) throw new ValidationError(validation.error);
    const result = await resourceSpecService.create(
      validation.data,
      resourceSpecRepo
    );
    ApiResponse.success(res, 201, "Resource spec created", result);
  } catch (error) {
    next(error);
  }
};

export const listResourceSpecs = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await resourceSpecService.list(resourceSpecRepo);
    ApiResponse.success(res, 200, "Resource specs retrieved", result);
  } catch (error) {
    next(error);
  }
};

export const getResourceSpec = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await resourceSpecService.getById(
      idValidation.data,
      resourceSpecRepo
    );
    ApiResponse.success(res, 200, "Resource spec retrieved", result);
  } catch (error) {
    next(error);
  }
};

export const updateResourceSpec = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const bodyValidation = ValidateRequest(req.body, UpdateResourceSpecDto);
    if (!bodyValidation.valid) throw new ValidationError(bodyValidation.error);
    const result = await resourceSpecService.update(
      idValidation.data,
      bodyValidation.data,
      resourceSpecRepo
    );
    ApiResponse.success(res, 200, "Resource spec updated", result);
  } catch (error) {
    next(error);
  }
};

export const deleteResourceSpec = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await resourceSpecService.remove(
      idValidation.data,
      resourceSpecRepo
    );
    ApiResponse.success(res, 200, "Resource spec deleted", result);
  } catch (error) {
    next(error);
  }
};
