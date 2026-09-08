import type { NextFunction, Response } from "express";
import type { Request } from "express";
import jwt, { JsonWebTokenError } from "jsonwebtoken";

import { env } from "../config/env";
import { AppError } from "../shared/errors/app-error";
import { prisma } from "../lib/prisma";
import { withActiveRecordFilter } from "../shared/utils/soft-delete";

type JwtPayload = {
  sub: string;
  email: string;
  role: "ADMIN" | "USER";
};

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError("Authorization header missing", 401, undefined, "AUTH_MISSING_TOKEN"));
  }

  const token = authHeader.substring("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);

    if (typeof payload === "string") {
      next(new AppError("Invalid token payload", 401, undefined, "AUTH_INVALID_PAYLOAD"));
      return;
    }

    if (!payload?.sub || typeof payload.sub !== "string") {
      next(new AppError("Invalid token payload", 401, undefined, "AUTH_INVALID_PAYLOAD"));
      return;
    }

    if (typeof payload.email !== "string" || !payload.role) {
      next(new AppError("Invalid token payload", 401, undefined, "AUTH_INVALID_PAYLOAD"));
      return;
    }

    const user = await prisma.user.findFirst({
      where: withActiveRecordFilter({ id: payload.sub, email: payload.email }),
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      next(
        new AppError(
          "Invalid token payload",
          401,
          undefined,
          "AUTH_INVALID_PAYLOAD"
        )
      );
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      next(new AppError("Invalid token", 401, { reason: error.message }, "AUTH_INVALID_TOKEN"));
      return;
    }
    next(error);
  }
};
