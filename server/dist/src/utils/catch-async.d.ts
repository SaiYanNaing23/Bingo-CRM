import type { NextFunction, Request, Response } from "express";
export declare const catchAsync: (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
//# sourceMappingURL=catch-async.d.ts.map