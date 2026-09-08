import { healthQuerySchema } from "../dto/health.dto";

export const validateHealthQuery = (data: unknown) => healthQuerySchema.parse(data);
