import { Response } from "express";

export class ApiResponse {
  static success<T>(
    res: Response,
    statusCode = 200,
    message: string,
    data?: T
  ) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /** Success response carrying pagination metadata alongside the data. */
  static paginated<T>(
    res: Response,
    message: string,
    data: T[],
    meta: { page: number; pageSize: number; total: number }
  ) {
    return res.status(200).json({
      success: true,
      message,
      data,
      meta: {
        ...meta,
        totalPages: Math.max(1, Math.ceil(meta.total / meta.pageSize)),
      },
    });
  }
}
