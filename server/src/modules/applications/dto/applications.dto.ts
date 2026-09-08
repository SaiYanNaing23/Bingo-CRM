import { z } from "zod";

export const applicationStageSchema = z.enum([
  "WISHLIST", "APPLIED", "HR", "TECHNICAL", "ASSIGNMENT", "FINAL", "OFFER", "REJECTED", "ARCHIVED",
]);

export const stageRequiresApplicationDate = (stage: string): boolean =>
  !["WISHLIST", "REJECTED", "ARCHIVED"].includes(stage);

const timestamp = z.iso.datetime({ offset: true }).pipe(z.coerce.date());
const timezone = z.string().trim().min(1).max(100).refine((value) => {
  // Only named timezones (including UTC); fixed numeric offsets are not zone names.
  if (/^[+-]/.test(value)) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}, "Invalid timezone; use an IANA name such as Asia/Yangon or UTC");

const detailFields = {
  companyId: z.uuid(),
  position: z.string().trim().min(2).max(200),
  dateApplied: timestamp.nullable(),
  salary: z.string().trim().min(1).max(200).nullable(),
  timezone,
  recruiter: z.uuid().nullable(),
  notes: z.string().trim().max(20000).nullable(),
};

export const createApplicationSchema = z.strictObject({
  ...detailFields,
  dateApplied: detailFields.dateApplied.optional(),
  salary: detailFields.salary.optional(),
  timezone: timezone.default("UTC"),
  recruiter: detailFields.recruiter.optional(),
  notes: detailFields.notes.optional(),
  stage: applicationStageSchema.default("WISHLIST"),
}).superRefine((value, ctx) => {
  if (stageRequiresApplicationDate(value.stage) && !value.dateApplied) {
    ctx.addIssue({ code: "custom", path: ["dateApplied"], message: "dateApplied is required for this stage" });
  }
});

// Stage, owner, and lifecycle fields are deliberately excluded from detail updates.
export const updateApplicationSchema = z.strictObject(detailFields).partial().refine(
  (value) => Object.values(value).some((field) => field !== undefined),
  "At least one application detail is required",
);

export const applicationIdSchema = z.uuid();
export const applicationStageUpdateSchema = z.strictObject({ stage: applicationStageSchema });
export const applicationHistoryQuerySchema = z.strictObject({
  page: z.coerce.number().int().positive().max(1_000_000).optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const applicationListQuerySchema = applicationHistoryQuerySchema.extend({
  companyId: z.uuid().optional(),
  stage: applicationStageSchema.optional(),
  dateAppliedFrom: timestamp.optional(),
  dateAppliedTo: timestamp.optional(),
  search: z.string().trim().max(200).optional(),
  sortBy: z.enum(["position", "dateApplied", "createdAt", "updatedAt"]).default("updatedAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
}).refine((value) => !value.dateAppliedFrom || !value.dateAppliedTo || value.dateAppliedFrom <= value.dateAppliedTo, {
  path: ["dateAppliedTo"], message: "dateAppliedTo must be on or after dateAppliedFrom",
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type ApplicationListQuery = z.infer<typeof applicationListQuerySchema>;
export type ApplicationHistoryQuery = z.infer<typeof applicationHistoryQuerySchema>;
export type ApplicationStageUpdate = z.infer<typeof applicationStageUpdateSchema>;
