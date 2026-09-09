import {
  createProjectSchema, updateProjectSchema, projectProgressSchema, projectCommentSchema,
  projectIdSchema, projectListQuerySchema, projectActivityQuerySchema,
} from "../dto/projects.dto";

export const validateCreateProject = (input: unknown) => createProjectSchema.parse(input);
export const validateUpdateProject = (input: unknown) => updateProjectSchema.parse(input);
export const validateProjectProgress = (input: unknown) => projectProgressSchema.parse(input);
export const validateProjectComment = (input: unknown) => projectCommentSchema.parse(input);
export const validateProjectId = (input: unknown) => projectIdSchema.parse(input);
export const validateProjectListQuery = (input: unknown) => projectListQuerySchema.parse(input);
export const validateProjectActivityQuery = (input: unknown) => projectActivityQuerySchema.parse(input);
