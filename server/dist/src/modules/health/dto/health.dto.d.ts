import { z } from "zod";
export declare const healthQuerySchema: z.ZodObject<{
    includeEnv: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<boolean, string>>>;
}, z.core.$strip>;
export type HealthQuery = z.input<typeof healthQuerySchema>;
//# sourceMappingURL=health.dto.d.ts.map