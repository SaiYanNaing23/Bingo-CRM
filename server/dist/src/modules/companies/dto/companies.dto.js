"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyStatusTransitionSchema = exports.companyListQuerySchema = exports.updateCompanySchema = exports.createCompanySchema = void 0;
const zod_1 = require("zod");
const statusValues = ["ACTIVE", "ARCHIVED"];
exports.createCompanySchema = zod_1.z.object({
    logo: zod_1.z.string().trim().min(1).nullable().optional(),
    name: zod_1.z.string().trim().min(2, "Name must be at least 2 characters"),
    country: zod_1.z.string().trim().min(1).nullable().optional(),
    industry: zod_1.z.string().trim().min(1).nullable().optional(),
    website: zod_1.z.url("Invalid website URL").nullable().optional(),
    linkedIn: zod_1.z.url("Invalid LinkedIn URL").nullable().optional(),
    careerPage: zod_1.z.url("Invalid career page URL").nullable().optional(),
    techStack: zod_1.z.array(zod_1.z.string().trim().min(1)).default([]),
    size: zod_1.z.number().int().positive("Size must be a positive integer").nullable().optional(),
    salaryRange: zod_1.z.string().trim().nullable().optional(),
    remote: zod_1.z.boolean().default(false),
    notes: zod_1.z.string().trim().nullable().optional(),
    status: zod_1.z.enum(statusValues).default("ACTIVE"),
});
exports.updateCompanySchema = exports.createCompanySchema.partial();
exports.companyListQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().optional(),
    limit: zod_1.z.coerce.number().int().positive().optional(),
    status: zod_1.z.enum(statusValues).optional(),
    country: zod_1.z.string().trim().optional(),
    industry: zod_1.z.string().trim().optional(),
    remote: zod_1.z.preprocess((value) => {
        if (typeof value === "string") {
            if (value === "true") {
                return true;
            }
            if (value === "false") {
                return false;
            }
        }
        return value;
    }, zod_1.z.boolean().optional()),
    search: zod_1.z.string().trim().optional(),
    sortBy: zod_1.z.enum(["name", "createdAt", "updatedAt"]).default("createdAt").optional(),
    order: zod_1.z.enum(["asc", "desc"]).default("desc").optional(),
});
exports.companyStatusTransitionSchema = zod_1.z.object({
    status: zod_1.z.enum(statusValues),
});
//# sourceMappingURL=companies.dto.js.map