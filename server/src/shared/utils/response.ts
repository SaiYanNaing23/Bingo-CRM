import type { Response } from "express";

import type {
  ApiResponse,
  PaginationMeta,
} from "../types/api-response";

export const sendSuccess = <TData>(
  res: Response,
  data: TData,
  statusCode = 200
): void => {
  const payload: ApiResponse<TData> = {
    success: true,
    data,
  };
  res.status(statusCode).json(payload);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  details?: unknown,
  code = "INTERNAL_ERROR"
): void => {
  const payload = {
    success: false,
    error: message,
    code,
    ...(details ? { details } : {}),
  } satisfies ApiResponse;
  res.status(statusCode).json(payload);
};

export const sendPaginated = <TData>(
  res: Response,
  data: TData[],
  meta: PaginationMeta,
  statusCode = 200
): void => {
  const payload: ApiResponse<TData[]> & { meta: PaginationMeta } = {
    success: true,
    data,
    meta,
  };
  res.status(statusCode).json(payload);
};
