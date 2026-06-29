import type { NextFunction, Request, Response } from "express";
import * as repository from "../../repository";
import * as service from "../../service";
import { AuthenticationError, ValidationError } from "../../util/error";
import { ApiResponse } from "../../util/global/response";
import { ValidateRequest } from "../../util/validator";
import { LoginDto } from "../dto/auth-req-dto";

const userRepo = repository.userRepo;
const authService = service.authService;

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = ValidateRequest(req.body, LoginDto);
    if (!validation.valid) throw new ValidationError(validation.error);
    const result = await authService.login(validation.data, userRepo);
    ApiResponse.success(res, 200, "Login successful", result);
  } catch (error) {
    next(error);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) throw new AuthenticationError("Authentication required");
    const result = await authService.me(req.auth.id, userRepo);
    ApiResponse.success(res, 200, "Current user", result);
  } catch (error) {
    next(error);
  }
};
