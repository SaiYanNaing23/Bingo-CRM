import { z } from "zod";

export const projectStatusSchema = z.enum(["PLANNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "ARCHIVED"]);
const progress = z.number().int().min(0).max(100);
const stateFields = { status: projectStatusSchema, progress };
const validState = (value: { status: z.infer<typeof projectStatusSchema>; progress: number }) => {
  switch (value.status) {
    case "PLANNED": return value.progress === 0;
    case "IN_PROGRESS":
    case "ON_HOLD": return value.progress < 100;
    case "COMPLETED": return value.progress === 100;
    case "ARCHIVED": return true;
  }
};
const stateError = {
  path: ["progress"],
  message: "PLANNED requires 0; IN_PROGRESS/ON_HOLD require 0-99; COMPLETED requires 100; ARCHIVED allows 0-100",
};
export const projectStateSchema = z.strictObject(stateFields).refine(validState, stateError);

const url = z.string().trim().max(2048).regex(/^https?:\/\//i, "Use a plain absolute HTTP(S) URL")
  .pipe(z.url({ protocol: /^https?$/ }));
const stackEntry = z.string().trim().min(1).max(50).toLowerCase();
const unique = (values: string[]) => [...new Set(values)];
const details = {
  name: z.string().trim().min(2).max(200),
  githubUrl: url.nullable(),
  liveDemoUrl: url.nullable(),
  stack: z.array(stackEntry).max(30).transform(unique),
  screenshots: z.array(url).max(20).transform(unique),
  lessonsLearned: z.string().max(50000).nullable(),
};
const content = z.string().trim().min(1).max(5000);

export const createProjectSchema = z.strictObject({
  ...details,
  githubUrl: details.githubUrl.optional(),
  liveDemoUrl: details.liveDemoUrl.optional(),
  stack: details.stack.default([]),
  screenshots: details.screenshots.default([]),
  lessonsLearned: details.lessonsLearned.optional(),
  status: projectStatusSchema.default("PLANNED"),
  progress: progress.default(0),
}).refine(validState, stateError);

export const updateProjectSchema = z.strictObject(details).partial().refine(
  (value) => Object.values(value).some((field) => field !== undefined), "At least one project detail is required",
);
export const projectProgressSchema = z.strictObject({
  status: projectStatusSchema.optional(), progress: progress.optional(), content: content.optional(),
}).refine((value) => value.status !== undefined || value.progress !== undefined, "Provide status and/or progress");
export const projectCommentSchema = z.strictObject({ content });
export const projectIdSchema = z.uuid();

// Require one scalar per query parameter; coercion alone would also accept repeated query arrays.
const queryInteger = z.string().regex(/^\d+$/).pipe(z.coerce.number<string>().int().positive());
export const projectActivityQuerySchema = z.strictObject({
  page: queryInteger.pipe(z.number().max(1_000_000)).optional(),
  limit: queryInteger.optional(),
});
export const projectListQuerySchema = projectActivityQuerySchema.extend({
  status: projectStatusSchema.optional(),
  stack: stackEntry.optional(),
  search: z.string().trim().max(200).optional(),
  sortBy: z.enum(["name", "progress", "createdAt", "updatedAt"]).default("updatedAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectProgressInput = z.infer<typeof projectProgressSchema>;
export type ProjectCommentInput = z.infer<typeof projectCommentSchema>;
export type ProjectListQuery = z.infer<typeof projectListQuerySchema>;
export type ProjectActivityQuery = z.infer<typeof projectActivityQuerySchema>;
