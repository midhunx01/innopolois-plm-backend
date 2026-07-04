import type { NextFunction, Request, Response } from "express";
import * as repository from "../../repository";
import * as service from "../../service";
import type { ProjectBomFilters } from "../../repository";
import type { BomStage } from "../../db/schema";
import { AuthenticationError, ValidationError } from "../../util/error";
import { ApiResponse } from "../../util/global/response";
import { parsePagination } from "../../util/types/pagination-types";
import { ValidateRequest } from "../../util/validator";
import { UuidString } from "../dto/global-req-dto";
import {
  CreateProjectBomDto,
  TransitionBomDto,
  UpdateProjectBomDto,
} from "../dto/project-bom-req-dto";

const projectBomRepo = repository.projectBomRepo;
const projectBomService = service.projectBomService;

const deps: service.ProjectBomServiceDeps = {
  projectBomRepo,
  projectRepo: repository.projectRepo,
  counterRepo: repository.counterRepo,
  bomLineRepo: repository.bomLineRepo,
  bomAuditRepo: repository.bomAuditRepo,
};

export const createBom = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = ValidateRequest(req.body, CreateProjectBomDto);
    if (!validation.valid) throw new ValidationError(validation.error);
    if (!req.auth) throw new AuthenticationError("Authentication required");
    const result = await projectBomService.create(
      validation.data,
      req.auth.id,
      deps
    );
    ApiResponse.success(res, 201, "BOM created", result);
  } catch (error) {
    next(error);
  }
};

export const listBoms = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, pageSize } = parsePagination(req.query);
    const q = req.query;
    const filters: ProjectBomFilters = {
      page,
      pageSize,
      projectId: typeof q.projectId === "string" ? q.projectId : undefined,
      stage: typeof q.stage === "string" ? (q.stage as BomStage) : undefined,
      // A Project Manager only sees BOMs of the projects assigned to them.
      managerId:
        req.auth?.role === "Project Manager" ? req.auth.id : undefined,
    };
    const { rows, total } = await projectBomService.list(filters, projectBomRepo);
    ApiResponse.paginated(res, "BOMs retrieved", rows, { page, pageSize, total });
  } catch (error) {
    next(error);
  }
};

// Detail view: BOM + lines + approval audit trail.
export const getBom = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const viewer = req.auth
      ? { id: req.auth.id, role: req.auth.role }
      : undefined;
    const result = await projectBomService.getDetail(
      idValidation.data,
      deps,
      viewer
    );
    ApiResponse.success(res, 200, "BOM retrieved", result);
  } catch (error) {
    next(error);
  }
};

export const updateBom = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const bodyValidation = ValidateRequest(req.body, UpdateProjectBomDto);
    if (!bodyValidation.valid) throw new ValidationError(bodyValidation.error);
    const result = await projectBomService.update(
      idValidation.data,
      bodyValidation.data,
      projectBomRepo
    );
    ApiResponse.success(res, 200, "BOM updated", result);
  } catch (error) {
    next(error);
  }
};

export const transitionBom = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const bodyValidation = ValidateRequest(req.body, TransitionBomDto);
    if (!bodyValidation.valid) throw new ValidationError(bodyValidation.error);
    if (!req.auth) throw new AuthenticationError("Authentication required");
    const result = await projectBomService.transition(
      idValidation.data,
      bodyValidation.data,
      { id: req.auth.id, role: req.auth.role },
      deps
    );
    ApiResponse.success(res, 200, `BOM ${bodyValidation.data.action}d`, result);
  } catch (error) {
    next(error);
  }
};

// GET /api/project-boms/:id/analysis?groupBy=category|vendor|leadtime|procurement
export const analyzeBom = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const allowed = ["category", "vendor", "leadtime", "procurement"] as const;
    const groupBy = (
      typeof req.query.groupBy === "string" ? req.query.groupBy : "category"
    ) as (typeof allowed)[number];
    if (!allowed.includes(groupBy)) {
      throw new ValidationError(
        `groupBy must be one of: ${allowed.join(", ")}`
      );
    }
    const result = await projectBomService.analyze(idValidation.data, groupBy, deps);
    ApiResponse.success(res, 200, "BOM analysis", result);
  } catch (error) {
    next(error);
  }
};

export const deleteBom = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    if (!req.auth) throw new AuthenticationError("Authentication required");
    const result = await projectBomService.remove(
      idValidation.data,
      { role: req.auth.role },
      deps
    );
    ApiResponse.success(res, 200, "BOM deleted", result);
  } catch (error) {
    next(error);
  }
};
