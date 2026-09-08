import { z } from "zod";
export declare const applicationStageSchema: z.ZodEnum<{
    HR: "HR";
    ARCHIVED: "ARCHIVED";
    WISHLIST: "WISHLIST";
    APPLIED: "APPLIED";
    TECHNICAL: "TECHNICAL";
    ASSIGNMENT: "ASSIGNMENT";
    FINAL: "FINAL";
    OFFER: "OFFER";
    REJECTED: "REJECTED";
}>;
export declare const stageRequiresApplicationDate: (stage: string) => boolean;
export declare const createApplicationSchema: z.ZodObject<{
    dateApplied: z.ZodOptional<z.ZodNullable<z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>>>;
    salary: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    timezone: z.ZodDefault<z.ZodString>;
    recruiter: z.ZodOptional<z.ZodNullable<z.ZodUUID>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stage: z.ZodDefault<z.ZodEnum<{
        HR: "HR";
        ARCHIVED: "ARCHIVED";
        WISHLIST: "WISHLIST";
        APPLIED: "APPLIED";
        TECHNICAL: "TECHNICAL";
        ASSIGNMENT: "ASSIGNMENT";
        FINAL: "FINAL";
        OFFER: "OFFER";
        REJECTED: "REJECTED";
    }>>;
    companyId: z.ZodUUID;
    position: z.ZodString;
}, z.core.$strict>;
export declare const updateApplicationSchema: z.ZodObject<{
    companyId: z.ZodOptional<z.ZodUUID>;
    position: z.ZodOptional<z.ZodString>;
    dateApplied: z.ZodOptional<z.ZodNullable<z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>>>;
    salary: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    timezone: z.ZodOptional<z.ZodString>;
    recruiter: z.ZodOptional<z.ZodNullable<z.ZodUUID>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strict>;
export declare const applicationIdSchema: z.ZodUUID;
export declare const applicationStageUpdateSchema: z.ZodObject<{
    stage: z.ZodEnum<{
        HR: "HR";
        ARCHIVED: "ARCHIVED";
        WISHLIST: "WISHLIST";
        APPLIED: "APPLIED";
        TECHNICAL: "TECHNICAL";
        ASSIGNMENT: "ASSIGNMENT";
        FINAL: "FINAL";
        OFFER: "OFFER";
        REJECTED: "REJECTED";
    }>;
}, z.core.$strict>;
export declare const applicationHistoryQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strict>;
export declare const applicationListQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    companyId: z.ZodOptional<z.ZodUUID>;
    stage: z.ZodOptional<z.ZodEnum<{
        HR: "HR";
        ARCHIVED: "ARCHIVED";
        WISHLIST: "WISHLIST";
        APPLIED: "APPLIED";
        TECHNICAL: "TECHNICAL";
        ASSIGNMENT: "ASSIGNMENT";
        FINAL: "FINAL";
        OFFER: "OFFER";
        REJECTED: "REJECTED";
    }>>;
    dateAppliedFrom: z.ZodOptional<z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>>;
    dateAppliedTo: z.ZodOptional<z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<{
        createdAt: "createdAt";
        updatedAt: "updatedAt";
        dateApplied: "dateApplied";
        position: "position";
    }>>;
    order: z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
}, z.core.$strict>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type ApplicationListQuery = z.infer<typeof applicationListQuerySchema>;
export type ApplicationHistoryQuery = z.infer<typeof applicationHistoryQuerySchema>;
export type ApplicationStageUpdate = z.infer<typeof applicationStageUpdateSchema>;
//# sourceMappingURL=applications.dto.d.ts.map