import { z } from "zod";
export declare const createCompanySchema: z.ZodObject<{
    logo: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    name: z.ZodString;
    country: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    industry: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    website: z.ZodOptional<z.ZodNullable<z.ZodURL>>;
    linkedIn: z.ZodOptional<z.ZodNullable<z.ZodURL>>;
    careerPage: z.ZodOptional<z.ZodNullable<z.ZodURL>>;
    techStack: z.ZodDefault<z.ZodArray<z.ZodString>>;
    size: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    salaryRange: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    remote: z.ZodDefault<z.ZodBoolean>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodDefault<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        ARCHIVED: "ARCHIVED";
    }>>;
}, z.core.$strip>;
export declare const updateCompanySchema: z.ZodObject<{
    logo: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    name: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    industry: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    website: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodURL>>>;
    linkedIn: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodURL>>>;
    careerPage: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodURL>>>;
    techStack: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString>>>;
    size: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    salaryRange: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    remote: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        ARCHIVED: "ARCHIVED";
    }>>>;
}, z.core.$strip>;
export declare const companyListQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    status: z.ZodOptional<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        ARCHIVED: "ARCHIVED";
    }>>;
    country: z.ZodOptional<z.ZodString>;
    industry: z.ZodOptional<z.ZodString>;
    remote: z.ZodPreprocess<z.ZodOptional<z.ZodBoolean>>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        createdAt: "createdAt";
        updatedAt: "updatedAt";
        name: "name";
    }>>>;
    order: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>>;
}, z.core.$strip>;
export declare const companyStatusTransitionSchema: z.ZodObject<{
    status: z.ZodEnum<{
        ACTIVE: "ACTIVE";
        ARCHIVED: "ARCHIVED";
    }>;
}, z.core.$strip>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CompanyListQueryInput = z.infer<typeof companyListQuerySchema>;
export type CompanyStatusTransitionInput = z.infer<typeof companyStatusTransitionSchema>;
//# sourceMappingURL=companies.dto.d.ts.map