import { loginSchema, registerSchema } from "../dto/auth.dto";

export const validateRegister = (data: unknown) => registerSchema.parse(data);
export const validateLogin = (data: unknown) => loginSchema.parse(data);

