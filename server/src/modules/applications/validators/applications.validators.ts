import {
  applicationHistoryQuerySchema,
  applicationIdSchema,
  applicationListQuerySchema,
  applicationStageUpdateSchema,
  createApplicationSchema,
  updateApplicationSchema,
} from "../dto/applications.dto";

export const validateCreateApplication = (input: unknown) => createApplicationSchema.parse(input);
export const validateUpdateApplication = (input: unknown) => updateApplicationSchema.parse(input);
export const validateApplicationId = (input: unknown) => applicationIdSchema.parse(input);
export const validateApplicationListQuery = (input: unknown) => applicationListQuerySchema.parse(input);
export const validateApplicationHistoryQuery = (input: unknown) => applicationHistoryQuerySchema.parse(input);
export const validateApplicationStageUpdate = (input: unknown) => applicationStageUpdateSchema.parse(input);
