import type { Request, Response } from "express";

import { sendSuccess } from "../../../shared/utils/response";
import { login as loginService, register as registerService } from "../services/auth.service";
import { validateLogin, validateRegister } from "../validators/auth.validators";

export const register = async (req: Request, res: Response) => {
  const payload = validateRegister(req.body);
  const result = await registerService(payload);

  sendSuccess(res, result, 201);
};

export const login = async (req: Request, res: Response) => {
  const payload = validateLogin(req.body);
  const result = await loginService(payload);

  sendSuccess(res, result);
};

export const me = async (req: Request, res: Response) => {
  sendSuccess(res, { user: req.user ?? null });
};
