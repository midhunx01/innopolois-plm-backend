import { Request, Response, NextFunction } from "express";
import {
  AuthenticationError,
  AuthorizeError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "./errors";
import { logger } from "../logger";

export const HandleErrorWithLogger = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let reportError = true;
  let status = 500;
  let data = error.message;

  // Known (expected) errors are not reported as server errors.
  [
    NotFoundError,
    ValidationError,
    AuthenticationError,
    AuthorizeError,
    ConflictError,
  ].forEach((typeOfError) => {
    if (error instanceof typeOfError) {
      reportError = false;
      status = error.status || 400;
      data = error.message;
    }
  });

  if (reportError) {
    logger.error(error);
  } else {
    logger.warn(error);
  }

  res.status(status).json({ success: false, error: data });
};

export const HandleUnCaughtException = async (error: Error) => {
  logger.error(error);
  process.exit(1);
};
