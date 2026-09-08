"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicationListQuerySchema = exports.applicationHistoryQuerySchema = exports.applicationStageUpdateSchema = exports.applicationIdSchema = exports.updateApplicationSchema = exports.createApplicationSchema = exports.stageRequiresApplicationDate = exports.applicationStageSchema = void 0;
const zod_1 = require("zod");
exports.applicationStageSchema = zod_1.z.enum([
    "WISHLIST", "APPLIED", "HR", "TECHNICAL", "ASSIGNMENT", "FINAL", "OFFER", "REJECTED", "ARCHIVED",
]);
const stageRequiresApplicationDate = (stage) => !["WISHLIST", "REJECTED", "ARCHIVED"].includes(stage);
exports.stageRequiresApplicationDate = stageRequiresApplicationDate;
const timestamp = zod_1.z.iso.datetime({ offset: true }).pipe(zod_1.z.coerce.date());
const timezone = zod_1.z.string().trim().min(1).max(100).refine((value) => {
    // Only named timezones (including UTC); fixed numeric offsets are not zone names.
    if (/^[+-]/.test(value))
        return false;
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: value });
        return true;
    }
    catch {
        return false;
    }
}, "Invalid timezone; use an IANA name such as Asia/Yangon or UTC");
const detailFields = {
    companyId: zod_1.z.uuid(),
    position: zod_1.z.string().trim().min(2).max(200),
    dateApplied: timestamp.nullable(),
    salary: zod_1.z.string().trim().min(1).max(200).nullable(),
    timezone,
    recruiter: zod_1.z.uuid().nullable(),
    notes: zod_1.z.string().trim().max(20000).nullable(),
};
exports.createApplicationSchema = zod_1.z.strictObject({
    ...detailFields,
    dateApplied: detailFields.dateApplied.optional(),
    salary: detailFields.salary.optional(),
    timezone: timezone.default("UTC"),
    recruiter: detailFields.recruiter.optional(),
    notes: detailFields.notes.optional(),
    stage: exports.applicationStageSchema.default("WISHLIST"),
}).superRefine((value, ctx) => {
    if ((0, exports.stageRequiresApplicationDate)(value.stage) && !value.dateApplied) {
        ctx.addIssue({ code: "custom", path: ["dateApplied"], message: "dateApplied is required for this stage" });
    }
});
// Stage, owner, and lifecycle fields are deliberately excluded from detail updates.
exports.updateApplicationSchema = zod_1.z.strictObject(detailFields).partial().refine((value) => Object.values(value).some((field) => field !== undefined), "At least one application detail is required");
exports.applicationIdSchema = zod_1.z.uuid();
exports.applicationStageUpdateSchema = zod_1.z.strictObject({ stage: exports.applicationStageSchema });
exports.applicationHistoryQuerySchema = zod_1.z.strictObject({
    page: zod_1.z.coerce.number().int().positive().max(1_000_000).optional(),
    limit: zod_1.z.coerce.number().int().positive().optional(),
});
exports.applicationListQuerySchema = exports.applicationHistoryQuerySchema.extend({
    companyId: zod_1.z.uuid().optional(),
    stage: exports.applicationStageSchema.optional(),
    dateAppliedFrom: timestamp.optional(),
    dateAppliedTo: timestamp.optional(),
    search: zod_1.z.string().trim().max(200).optional(),
    sortBy: zod_1.z.enum(["position", "dateApplied", "createdAt", "updatedAt"]).default("updatedAt"),
    order: zod_1.z.enum(["asc", "desc"]).default("desc"),
}).refine((value) => !value.dateAppliedFrom || !value.dateAppliedTo || value.dateAppliedFrom <= value.dateAppliedTo, {
    path: ["dateAppliedTo"], message: "dateAppliedTo must be on or after dateAppliedFrom",
});
//# sourceMappingURL=applications.dto.js.map