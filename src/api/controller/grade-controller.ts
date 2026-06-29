import type { NextFunction, Request, Response } from "express";
import * as repository from "../../repository";
import * as service from "../../service";
import { ValidationError } from "../../util/error";
import { ApiResponse } from "../../util/global/response";
import { ValidateRequest } from "../../util/validator";
import { UuidString } from "../dto/global-req-dto";
import { CreateGradeDto, UpdateGradeDto } from "../dto/grade-req-dto";

const gradeRepo = repository.gradeRepo;
const gradeService = service.gradeService;

export const createGrade = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = ValidateRequest(req.body, CreateGradeDto);
    if (!validation.valid) throw new ValidationError(validation.error);
    const result = await gradeService.create(validation.data, gradeRepo);
    ApiResponse.success(res, 201, "Grade created", result);
  } catch (error) {
    next(error);
  }
};

export const listGrades = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await gradeService.list(gradeRepo);
    ApiResponse.success(res, 200, "Grades retrieved", result);
  } catch (error) {
    next(error);
  }
};

export const getGrade = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await gradeService.getById(idValidation.data, gradeRepo);
    ApiResponse.success(res, 200, "Grade retrieved", result);
  } catch (error) {
    next(error);
  }
};

export const updateGrade = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const bodyValidation = ValidateRequest(req.body, UpdateGradeDto);
    if (!bodyValidation.valid) throw new ValidationError(bodyValidation.error);
    const result = await gradeService.update(
      idValidation.data,
      bodyValidation.data,
      gradeRepo
    );
    ApiResponse.success(res, 200, "Grade updated", result);
  } catch (error) {
    next(error);
  }
};

export const deleteGrade = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await gradeService.remove(idValidation.data, gradeRepo);
    ApiResponse.success(res, 200, "Grade deleted", result);
  } catch (error) {
    next(error);
  }
};
