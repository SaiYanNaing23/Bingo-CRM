import { z } from "zod";

const statusValues = ["ACTIVE", "ARCHIVED"] as const;

export const createCompanySchema = z.object({
  logo: z.string().trim().min(1).nullable().optional(),
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  country: z.string().trim().min(1).nullable().optional(),
  industry: z.string().trim().min(1).nullable().optional(),
  website: z.url("Invalid website URL").nullable().optional(),
  linkedIn: z.url("Invalid LinkedIn URL").nullable().optional(),
  careerPage: z.url("Invalid career page URL").nullable().optional(),
  techStack: z.array(z.string().trim().min(1)).default([]),
  size: z.number().int().positive("Size must be a positive integer").nullable().optional(),
  salaryRange: z.string().trim().nullable().optional(),
  remote: z.boolean().default(false),
  notes: z.string().trim().nullable().optional(),
  status: z.enum(statusValues).default("ACTIVE"),
});

export const updateCompanySchema = createCompanySchema.partial();

export const companyListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.enum(statusValues).optional(),
  country: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  remote: z.preprocess((value) => {
    if (typeof value === "string") {
      if (value === "true") {
        return true;
      }
      if (value === "false") {
        return false;
      }
    }
    return value;
  }, z.boolean().optional()),
  search: z.string().trim().optional(),
  sortBy: z.enum(["name", "createdAt", "updatedAt"]).default("createdAt").optional(),
  order: z.enum(["asc", "desc"]).default("desc").optional(),
});

export const companyStatusTransitionSchema = z.object({
  status: z.enum(statusValues),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CompanyListQueryInput = z.infer<typeof companyListQuerySchema>;
export type CompanyStatusTransitionInput = z.infer<typeof companyStatusTransitionSchema>;
