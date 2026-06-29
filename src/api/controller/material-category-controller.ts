import type { NextFunction, Request, Response } from "express";
import * as repository from "../../repository";
import * as service from "../../service";
import { ValidationError } from "../../util/error";
import { ApiResponse } from "../../util/global/response";
import { ValidateRequest } from "../../util/validator";
import { UuidString } from "../dto/global-req-dto";
import {
  CreateMaterialCategoryDto,
  UpdateMaterialCategoryDto,
} from "../dto/material-category-req-dto";

const categoryRepo = repository.materialCategoryRepo;
const categoryService = service.materialCategoryService;

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = ValidateRequest(req.body, CreateMaterialCategoryDto);
    if (!validation.valid) throw new ValidationError(validation.error);
    const result = await categoryService.create(validation.data, categoryRepo);
    ApiResponse.success(res, 201, "Category created", result);
  } catch (error) {
    next(error);
  }
};

export const listCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await categoryService.list(categoryRepo);
    ApiResponse.success(res, 200, "Categories retrieved", result);
  } catch (error) {
    next(error);
  }
};

export const getCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await categoryService.getById(idValidation.data, categoryRepo);
    ApiResponse.success(res, 200, "Category retrieved", result);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const bodyValidation = ValidateRequest(req.body, UpdateMaterialCategoryDto);
    if (!bodyValidation.valid) throw new ValidationError(bodyValidation.error);
    const result = await categoryService.update(
      idValidation.data,
      bodyValidation.data,
      categoryRepo
    );
    ApiResponse.success(res, 200, "Category updated", result);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await categoryService.remove(idValidation.data, categoryRepo);
    ApiResponse.success(res, 200, "Category deleted", result);
  } catch (error) {
    next(error);
  }
};
