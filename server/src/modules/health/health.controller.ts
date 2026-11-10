import type { NextFunction, Request, Response } from "express";

import type { HealthQuery } from "./dto/health.dto";
import { getHealth, getReadiness } from "./health.service";
import { validateHealthQuery } from "./validators/health.validators";
import { sendSuccess } from "../../shared/utils/response";

export const healthController = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  res.setHeader("Cache-Control", "no-store");
  validateHealthQuery(req.query as HealthQuery);

  const payload = await getHealth();
  sendSuccess(res, payload);
};

export const readinessController = async (_req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store");
  const payload = await getReadiness();
  sendSuccess(res, payload);
};
