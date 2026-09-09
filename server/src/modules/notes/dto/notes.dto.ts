import { z } from "zod";

export const noteEntityTypes = ["COMPANY", "CONTACT", "APPLICATION", "TASK", "PROJECT"] as const;
export const noteEntityTypeSchema = z.enum(noteEntityTypes);
export const noteEntitySchema = z.strictObject({ type: noteEntityTypeSchema, id: z.uuid() });
// PostgreSQL text cannot retain NUL or malformed Unicode; reject rather than alter the source.
const text = z.string().refine(value => !value.includes("\0") && value.isWellFormed(), "Use valid Unicode text without NUL characters");
const tag = text.trim().min(1).max(40).toLowerCase();
const fields = {
  title: text.trim().min(2).max(200),
  content: text.max(100000).refine(value => value.trim().length > 0, "Content must not be blank"),
  tags: z.array(tag).max(20).transform(values => [...new Set(values)]),
  entity: noteEntitySchema.nullable(),
};
export const createNoteSchema = z.strictObject({
  ...fields, tags: fields.tags.default([]), entity: fields.entity.default(null),
});
export const updateNoteSchema = z.strictObject(fields).partial().refine(
  value => Object.values(value).some(field => field !== undefined), "At least one note field is required",
);
export const noteIdSchema = z.uuid();
const queryInteger = z.string().regex(/^\d+$/).pipe(z.coerce.number<string>().int().positive());
export const noteListQuerySchema = z.strictObject({
  page: queryInteger.pipe(z.number().max(1_000_000)).optional(),
  limit: queryInteger.optional(),
  tag: tag.optional(),
  search: text.trim().max(200).optional(),
  entityType: noteEntityTypeSchema.optional(),
  entityId: z.uuid().optional(),
  sortBy: z.enum(["title", "createdAt", "updatedAt"]).default("updatedAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
}).refine(value => (value.entityType === undefined) === (value.entityId === undefined), {
  path: ["entityId"], message: "Provide entityType and entityId together",
});

export type NoteEntityType = z.infer<typeof noteEntityTypeSchema>;
export type NoteEntity = z.infer<typeof noteEntitySchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type NoteListQuery = z.infer<typeof noteListQuerySchema>;
