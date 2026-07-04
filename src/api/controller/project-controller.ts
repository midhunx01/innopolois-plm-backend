import type { NextFunction, Request, Response } from "express";
import * as repository from "../../repository";
import * as service from "../../service";
import type { ProjectFilters } from "../../repository";
import type { ProjectStage } from "../../db/schema";
import { AuthenticationError, ValidationError } from "../../util/error";
import { ApiResponse } from "../../util/global/response";
import { parsePagination } from "../../util/types/pagination-types";
import { ValidateRequest } from "../../util/validator";
import { UuidString } from "../dto/global-req-dto";
import {
  CreateProjectDto,
  UpdateProjectDto,
  UpdateProjectStageDto,
} from "../dto/project-req-dto";

const projectRepo = repository.projectRepo;
const projectService = service.projectService;

const deps: service.ProjectServiceDeps = {
  projectRepo,
  counterRepo: repository.counterRepo,
};

export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = ValidateRequest(req.body, CreateProjectDto);
    if (!validation.valid) throw new ValidationError(validation.error);
    if (!req.auth) throw new AuthenticationError("Authentication required");
    const result = await projectService.create(validation.data, req.auth.id, deps);
    ApiResponse.success(res, 201, "Project created", result);
  } catch (error) {
    next(error);
  }
};

export const listProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, pageSize } = parsePagination(req.query);
    const q = req.query;
    const filters: ProjectFilters = {
      page,
      pageSize,
      search: typeof q.search === "string" ? q.search : undefined,
      stage: typeof q.stage === "string" ? (q.stage as ProjectStage) : undefined,
      customer: typeof q.customer === "string" ? q.customer : undefined,
      // A Project Manager only sees the projects assigned to them.
      managerId:
        req.auth?.role === "Project Manager" ? req.auth.id : undefined,
    };
    const { rows, total } = await projectService.list(filters, projectRepo);
    ApiResponse.paginated(res, "Projects retrieved", rows, {
      page,
      pageSize,
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const getProject = async (
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
    const result = await projectService.getById(
      idValidation.data,
      projectRepo,
      viewer
    );
    ApiResponse.success(res, 200, "Project retrieved", result);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const bodyValidation = ValidateRequest(req.body, UpdateProjectDto);
    if (!bodyValidation.valid) throw new ValidationError(bodyValidation.error);
    const result = await projectService.update(
      idValidation.data,
      bodyValidation.data,
      projectRepo
    );
    ApiResponse.success(res, 200, "Project updated", result);
  } catch (error) {
    next(error);
  }
};

export const updateProjectStage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const bodyValidation = ValidateRequest(req.body, UpdateProjectStageDto);
    if (!bodyValidation.valid) throw new ValidationError(bodyValidation.error);
    if (!req.auth) throw new AuthenticationError("Authentication required");
    const result = await projectService.updateStage(
      idValidation.data,
      bodyValidation.data.stage,
      { id: req.auth.id, role: req.auth.role },
      projectRepo
    );
    ApiResponse.success(res, 200, "Project stage updated", result);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await projectService.remove(idValidation.data, projectRepo);
    ApiResponse.success(res, 200, "Project deleted", result);
  } catch (error) {
    next(error);
  }
};
