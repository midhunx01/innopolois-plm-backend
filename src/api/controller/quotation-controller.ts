import type { NextFunction, Request, Response } from "express";
import * as repository from "../../repository";
import * as service from "../../service";
import { ValidationError } from "../../util/error";
import { ApiResponse } from "../../util/global/response";
import { ValidateRequest } from "../../util/validator";
import { UuidString } from "../dto/global-req-dto";
import { CreateQuotationDto } from "../dto/quotation-req-dto";

const quotationService = service.quotationService;

const deps: service.QuotationServiceDeps = {
  quotationRepo: repository.quotationRepo,
  quotationLineRepo: repository.quotationLineRepo,
  rfqRepo: repository.rfqRepo,
  rfqLineRepo: repository.rfqLineRepo,
  supplierRepo: repository.supplierRepo,
};

// POST /api/rfqs/:id/quotations
export const createQuotation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const validation = ValidateRequest(req.body, CreateQuotationDto);
    if (!validation.valid) throw new ValidationError(validation.error);
    const result = await quotationService.create(
      idValidation.data,
      validation.data,
      deps
    );
    ApiResponse.success(res, 201, "Quotation recorded", result);
  } catch (error) {
    next(error);
  }
};

// GET /api/rfqs/:id/quotations
export const listQuotations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await quotationService.listByRfq(idValidation.data, deps);
    ApiResponse.success(res, 200, "Quotations retrieved", result);
  } catch (error) {
    next(error);
  }
};

// GET /api/rfqs/:id/comparison
export const compareQuotations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await quotationService.compare(idValidation.data, deps);
    ApiResponse.success(res, 200, "Quotation comparison", result);
  } catch (error) {
    next(error);
  }
};

// GET /api/quotations/:id
export const getQuotation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await quotationService.getDetail(idValidation.data, deps);
    ApiResponse.success(res, 200, "Quotation retrieved", result);
  } catch (error) {
    next(error);
  }
};

// POST /api/quotations/:id/award
export const awardQuotation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = ValidateRequest(req.params.id, UuidString);
    if (!idValidation.valid) throw new ValidationError(idValidation.error);
    const result = await quotationService.award(idValidation.data, deps);
    ApiResponse.success(res, 200, "Quotation awarded", result);
  } catch (error) {
    next(error);
  }
};
