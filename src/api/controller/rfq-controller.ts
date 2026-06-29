import type { NextFunction, Request, Response } from "express";
import * as repository from "../../repository";
import * as service from "../../service";
import type { RfqFilters } from "../../repository";
import type { RfqStatus } from "../../db/schema";
import { AuthenticationError, ValidationError } from "../../util/error";
import { ApiResponse } from "../../util/global/response";
import { parsePagination } from "../../util/types/pagination-types";
import { ValidateRequest } from "../../util/validator";
import { UuidString } from "../dto/global-req-dto";
import { CreateRfqDto, UpdateRfqDto } from "../dto/rfq-req-dto";

const rfqRepo = repository.rfqRepo;
const rfqService = service.rfqService;

const deps: service.RfqServiceDeps = {
  rfqRepo,
  rfqLineRepo: repository.rfqLineRepo,
  partRepo: repository.partRepo,
  supplierRepo: repository.supplierRepo,
  projectBomRepo: repository.projectBomRepo,
  bomLineRepo: repository.bomLineRepo,
  quotationRepo: repository.quotationRepo,
  counterRepo: repository.counterRepo,
};

export const createRfq = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = ValidateRequest(req.body, CreateRfqDto);
    if (!validation.valid) throw new ValidationError(validation.error);
    if (!req.auth) throw new AuthenticationError("Authentication required");
    const result = await rfqService.create(validation.data, req.auth.id, deps);
    ApiResponse.success(res, 201, "RFQ created", result);
  } catch (error) {
    next(error);
  }
};

export const listRfqs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, pageSize } = parsePagination(req.query);
    const q = req.query;
    const filters: RfqFilters = {
      page,
      pageSize,
      search: typeof q.search === "string" ? q.search : undefined,
      status: typeof q.status === "string" ? (q.status as RfqStatus) : undefined,
      projectId: typeof q.projectId === "string" ? q.projectId : undefined,
    };
    const { rows, total } = await rfqService.list(filters, rfqRepo);
    ApiResponse.paginated(res, "RFQs retrieved", rows, { page, pageSize, total });
  } catch (error) {
    next(error);
  }
};

export const getRfq = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await rfqService.getDetail(idValidation.data, deps);
    ApiResponse.success(res, 200, "RFQ retrieved", result);
  } catch (error) {
    next(error);
  }
};

export const updateRfq = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const bodyValidation = ValidateRequest(req.body, UpdateRfqDto);
    if (!bodyValidation.valid) throw new ValidationError(bodyValidation.error);
    const result = await rfqService.update(
      idValidation.data,
      bodyValidation.data,
      rfqRepo
    );
    ApiResponse.success(res, 200, "RFQ updated", result);
  } catch (error) {
    next(error);
  }
};

export const sendRfq = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await rfqService.send(idValidation.data, rfqRepo);
    ApiResponse.success(res, 200, "RFQ sent to vendors", result);
  } catch (error) {
    next(error);
  }
};

export const deleteRfq = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await rfqService.remove(idValidation.data, rfqRepo);
    ApiResponse.success(res, 200, "RFQ deleted", result);
  } catch (error) {
    next(error);
  }
};
