import type { NextFunction, Request, Response } from "express";
import * as repository from "../../repository";
import * as service from "../../service";
import type { UserFilters } from "../../repository";
import type { Role } from "../../db/schema";
import { AuthenticationError, ValidationError } from "../../util/error";
import { ApiResponse } from "../../util/global/response";
import { parsePagination } from "../../util/types/pagination-types";
import { ValidateRequest } from "../../util/validator";
import { UuidString } from "../dto/global-req-dto";
import {
  CreateUserDto,
  ResetPasswordDto,
  UpdateUserDto,
} from "../dto/user-req-dto";

const userRepo = repository.userRepo;
const userService = service.userService;

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = ValidateRequest(req.body, CreateUserDto);
    if (!validation.valid) throw new ValidationError(validation.error);
    const result = await userService.create(validation.data, userRepo);
    ApiResponse.success(res, 201, "User created", result);
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, pageSize } = parsePagination(req.query);
    const q = req.query;
    const filters: UserFilters = {
      page,
      pageSize,
      search: typeof q.search === "string" ? q.search : undefined,
      role: typeof q.role === "string" ? (q.role as Role) : undefined,
    };
    const { rows, total } = await userService.list(filters, userRepo);
    ApiResponse.paginated(res, "Users retrieved", rows, { page, pageSize, total });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await userService.getById(idValidation.data, userRepo);
    ApiResponse.success(res, 200, "User retrieved", result);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const bodyValidation = ValidateRequest(req.body, UpdateUserDto);
    if (!bodyValidation.valid) throw new ValidationError(bodyValidation.error);
    if (!req.auth) throw new AuthenticationError("Authentication required");
    const result = await userService.update(
      idValidation.data,
      bodyValidation.data,
      req.auth.id,
      userRepo
    );
    ApiResponse.success(res, 200, "User updated", result);
  } catch (error) {
    next(error);
  }
};

// POST /api/users/:id/reset-password — admin sets a temporary password.
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const bodyValidation = ValidateRequest(req.body ?? {}, ResetPasswordDto);
    if (!bodyValidation.valid) throw new ValidationError(bodyValidation.error);
    const result = await userService.resetPassword(
      idValidation.data,
      bodyValidation.data,
      userRepo
    );
    ApiResponse.success(res, 200, "Temporary password set", result);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    if (!req.auth) throw new AuthenticationError("Authentication required");
    const result = await userService.remove(
      idValidation.data,
      req.auth.id,
      userRepo
    );
    ApiResponse.success(res, 200, "User deactivated", result);
  } catch (error) {
    next(error);
  }
};
