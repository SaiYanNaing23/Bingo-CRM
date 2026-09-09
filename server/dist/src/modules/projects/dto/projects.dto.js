"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectListQuerySchema = exports.projectActivityQuerySchema = exports.projectIdSchema = exports.projectCommentSchema = exports.projectProgressSchema = exports.updateProjectSchema = exports.createProjectSchema = exports.projectStateSchema = exports.projectStatusSchema = void 0;
const zod_1 = require("zod");
exports.projectStatusSchema = zod_1.z.enum(["PLANNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "ARCHIVED"]);
const progress = zod_1.z.number().int().min(0).max(100);
const stateFields = { status: exports.projectStatusSchema, progress };
const validState = (value) => {
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
exports.projectStateSchema = zod_1.z.strictObject(stateFields).refine(validState, stateError);
const url = zod_1.z.string().trim().max(2048).regex(/^https?:\/\//i, "Use a plain absolute HTTP(S) URL")
    .pipe(zod_1.z.url({ protocol: /^https?$/ }));
const stackEntry = zod_1.z.string().trim().min(1).max(50).toLowerCase();
const unique = (values) => [...new Set(values)];
const details = {
    name: zod_1.z.string().trim().min(2).max(200),
    githubUrl: url.nullable(),
    liveDemoUrl: url.nullable(),
    stack: zod_1.z.array(stackEntry).max(30).transform(unique),
    screenshots: zod_1.z.array(url).max(20).transform(unique),
    lessonsLearned: zod_1.z.string().max(50000).nullable(),
};
const content = zod_1.z.string().trim().min(1).max(5000);
exports.createProjectSchema = zod_1.z.strictObject({
    ...details,
    githubUrl: details.githubUrl.optional(),
    liveDemoUrl: details.liveDemoUrl.optional(),
    stack: details.stack.default([]),
    screenshots: details.screenshots.default([]),
    lessonsLearned: details.lessonsLearned.optional(),
    status: exports.projectStatusSchema.default("PLANNED"),
    progress: progress.default(0),
}).refine(validState, stateError);
exports.updateProjectSchema = zod_1.z.strictObject(details).partial().refine((value) => Object.values(value).some((field) => field !== undefined), "At least one project detail is required");
exports.projectProgressSchema = zod_1.z.strictObject({
    status: exports.projectStatusSchema.optional(), progress: progress.optional(), content: content.optional(),
}).refine((value) => value.status !== undefined || value.progress !== undefined, "Provide status and/or progress");
exports.projectCommentSchema = zod_1.z.strictObject({ content });
exports.projectIdSchema = zod_1.z.uuid();
// Require one scalar per query parameter; coercion alone would also accept repeated query arrays.
const queryInteger = zod_1.z.string().regex(/^\d+$/).pipe(zod_1.z.coerce.number().int().positive());
exports.projectActivityQuerySchema = zod_1.z.strictObject({
    page: queryInteger.pipe(zod_1.z.number().max(1_000_000)).optional(),
    limit: queryInteger.optional(),
});
exports.projectListQuerySchema = exports.projectActivityQuerySchema.extend({
    status: exports.projectStatusSchema.optional(),
    stack: stackEntry.optional(),
    search: zod_1.z.string().trim().max(200).optional(),
    sortBy: zod_1.z.enum(["name", "progress", "createdAt", "updatedAt"]).default("updatedAt"),
    order: zod_1.z.enum(["asc", "desc"]).default("desc"),
});
//# sourceMappingURL=projects.dto.js.map