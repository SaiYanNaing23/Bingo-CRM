"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noteListQuerySchema = exports.noteIdSchema = exports.updateNoteSchema = exports.createNoteSchema = exports.noteEntitySchema = exports.noteEntityTypeSchema = exports.noteEntityTypes = void 0;
const zod_1 = require("zod");
exports.noteEntityTypes = ["COMPANY", "CONTACT", "APPLICATION", "TASK", "PROJECT"];
exports.noteEntityTypeSchema = zod_1.z.enum(exports.noteEntityTypes);
exports.noteEntitySchema = zod_1.z.strictObject({ type: exports.noteEntityTypeSchema, id: zod_1.z.uuid() });
// PostgreSQL text cannot retain NUL or malformed Unicode; reject rather than alter the source.
const text = zod_1.z.string().refine(value => !value.includes("\0") && value.isWellFormed(), "Use valid Unicode text without NUL characters");
const tag = text.trim().min(1).max(40).toLowerCase();
const fields = {
    title: text.trim().min(2).max(200),
    content: text.max(100000).refine(value => value.trim().length > 0, "Content must not be blank"),
    tags: zod_1.z.array(tag).max(20).transform(values => [...new Set(values)]),
    entity: exports.noteEntitySchema.nullable(),
};
exports.createNoteSchema = zod_1.z.strictObject({
    ...fields, tags: fields.tags.default([]), entity: fields.entity.default(null),
});
exports.updateNoteSchema = zod_1.z.strictObject(fields).partial().refine(value => Object.values(value).some(field => field !== undefined), "At least one note field is required");
exports.noteIdSchema = zod_1.z.uuid();
const queryInteger = zod_1.z.string().regex(/^\d+$/).pipe(zod_1.z.coerce.number().int().positive());
exports.noteListQuerySchema = zod_1.z.strictObject({
    page: queryInteger.pipe(zod_1.z.number().max(1_000_000)).optional(),
    limit: queryInteger.optional(),
    tag: tag.optional(),
    search: text.trim().max(200).optional(),
    entityType: exports.noteEntityTypeSchema.optional(),
    entityId: zod_1.z.uuid().optional(),
    sortBy: zod_1.z.enum(["title", "createdAt", "updatedAt"]).default("updatedAt"),
    order: zod_1.z.enum(["asc", "desc"]).default("desc"),
}).refine(value => (value.entityType === undefined) === (value.entityId === undefined), {
    path: ["entityId"], message: "Provide entityType and entityId together",
});
//# sourceMappingURL=notes.dto.js.map