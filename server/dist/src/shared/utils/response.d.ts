import type { Response } from "express";
import type { PaginationMeta } from "../types/api-response";
export declare const sendSuccess: <TData>(res: Response, data: TData, statusCode?: number) => void;
export declare const sendError: (res: Response, message: string, statusCode?: number, details?: unknown, code?: string) => void;
export declare const sendPaginated: <TData>(res: Response, data: TData[], meta: PaginationMeta, statusCode?: number) => void;
//# sourceMappingURL=response.d.ts.map