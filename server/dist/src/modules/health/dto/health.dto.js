"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthQuerySchema = void 0;
const zod_1 = require("zod");
exports.healthQuerySchema = zod_1.z.object({
    includeEnv: zod_1.z
        .string()
        .transform((value) => value === "true")
        .optional(),
});
//# sourceMappingURL=health.dto.js.map