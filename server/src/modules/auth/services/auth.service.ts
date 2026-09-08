import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";

import { env } from "../../../config/env";
import { AppError } from "../../../shared/errors/app-error";
import { prisma } from "../../../lib/prisma";
import { withActiveRecordFilter } from "../../../shared/utils/soft-delete";
import type { LoginInput, RegisterInput } from "../dto/auth.dto";
import type { AuthTokenPayload, PublicUser } from "../types/auth.types";

const mapUser = (user: {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "USER";
  createdAt: Date;
  updatedAt: Date;
}): PublicUser => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const signToken = (user: PublicUser): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN,
  };

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET,
    options
  );
};

export const register = async (input: RegisterInput): Promise<AuthTokenPayload> => {
  const email = input.email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError("Email already in use", 409, "Email must be unique", "AUTH_DUPLICATE");
  }

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);

  const userRecord = await prisma.user.create({
    data: {
      email,
      fullName: input.fullName,
      passwordHash,
      role: "USER",
    },
  });

  const user = mapUser(userRecord);
  const token = signToken(user);

  return { user, token };
};

export const login = async (input: LoginInput): Promise<AuthTokenPayload> => {
  const email = input.email.toLowerCase();

  const userRecord = await prisma.user.findFirst({
    where: withActiveRecordFilter({ email }),
  });

  if (!userRecord) {
    throw new AppError("Invalid email or password", 401, undefined, "AUTH_INVALID_CREDENTIALS");
  }

  const passwordMatch = await bcrypt.compare(input.password, userRecord.passwordHash);

  if (!passwordMatch) {
    throw new AppError("Invalid email or password", 401, undefined, "AUTH_INVALID_CREDENTIALS");
  }

  const user = mapUser(userRecord);
  const token = signToken(user);

  return { user, token };
};
