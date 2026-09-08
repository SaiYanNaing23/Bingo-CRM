import { z } from "zod";

export const healthQuerySchema = z.object({
  includeEnv: z
    .string()
    .transform((value) => value === "true")
    .optional(),
});

export type HealthQuery = z.input<typeof healthQuerySchema>;
