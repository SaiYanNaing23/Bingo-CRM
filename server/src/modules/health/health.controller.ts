import type { NextFunction, Request, Response } from "express";

import type { HealthQuery } from "./dto/health.dto";
import { getHealth } from "./health.service";
import { validateHealthQuery } from "./validators/health.validators";
import { sendSuccess } from "../../shared/utils/response";

export const healthController = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  validateHealthQuery(req.query as HealthQuery);

  const payload = await getHealth();
  sendSuccess(res, payload);
};
