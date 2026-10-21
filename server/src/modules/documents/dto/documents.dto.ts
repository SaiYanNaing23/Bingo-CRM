import { z } from "zod";

export const documentEntityTypes = ["COMPANY", "CONTACT", "APPLICATION", "TASK", "PROJECT"] as const;
export const documentEntityTypeSchema = z.enum(documentEntityTypes);
export const documentEntitySchema = z.strictObject({ type: documentEntityTypeSchema, id: z.uuid() });

export const documentTypes = [
  "RESUME",
  "COVER_LETTER",
  "CERTIFICATE",
  "ASSIGNMENT",
  "OFFER_LETTER",
  "CONTRACT",
  "OTHER",
] as const;
export const documentTypeSchema = z.enum(documentTypes);

const text = z.string().refine(value => !value.includes("\0") && value.isWellFormed(), "Use valid Unicode text without NUL characters");
const tag = text.trim().min(1).max(40).toLowerCase();

const fileFields = {
  fileName: text.trim().min(1).max(255),
  fileSize: z.coerce.number().int().positive().max(104_857_600, "Maximum file size is 100MB"),
  mimeType: text.trim().min(3).max(100),
  fileUrl: text.trim().min(1).max(2000),
  storageProvider: text.trim().min(1).max(50),
  storageKey: text.trim().max(500),
  changelog: text.trim().max(1000),
};

const metadataFields = {
  title: text.trim().min(2).max(200),
  type: documentTypeSchema,
  description: text.trim().max(2000).nullable(),
  tags: z.array(tag).max(20).transform(values => [...new Set(values)]),
  entity: documentEntitySchema.nullable(),
};

export const createDocumentSchema = z.strictObject({
  title: metadataFields.title,
  type: metadataFields.type.default("OTHER"),
  description: metadataFields.description.optional().default(null),
  tags: metadataFields.tags.default([]),
  entity: metadataFields.entity.default(null),
  fileName: fileFields.fileName,
  fileSize: fileFields.fileSize,
  mimeType: fileFields.mimeType,
  fileUrl: fileFields.fileUrl,
  storageProvider: fileFields.storageProvider.default("METADATA"),
  storageKey: fileFields.storageKey.optional(),
  changelog: fileFields.changelog.optional(),
});

export const updateDocumentSchema = z.strictObject(metadataFields).partial().refine(
  value => Object.values(value).some(field => field !== undefined),
  "At least one document field is required",
);

export const createDocumentVersionSchema = z.strictObject({
  fileName: fileFields.fileName,
  fileSize: fileFields.fileSize,
  mimeType: fileFields.mimeType,
  fileUrl: fileFields.fileUrl,
  storageProvider: fileFields.storageProvider.default("METADATA"),
  storageKey: fileFields.storageKey.optional(),
  changelog: fileFields.changelog.optional(),
});

export const documentIdSchema = z.uuid();
export const versionIdSchema = z.uuid();

const queryInteger = z.string().regex(/^\d+$/).pipe(z.coerce.number<string>().int().positive());

export const documentListQuerySchema = z.strictObject({
  page: queryInteger.pipe(z.number().max(1_000_000)).optional(),
  limit: queryInteger.optional(),
  type: documentTypeSchema.optional(),
  tag: tag.optional(),
  search: text.trim().max(200).optional(),
  entityType: documentEntityTypeSchema.optional(),
  entityId: z.uuid().optional(),
  sortBy: z.enum(["title", "createdAt", "updatedAt"]).default("updatedAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
}).refine(value => (value.entityType === undefined) === (value.entityId === undefined), {
  path: ["entityId"],
  message: "Provide entityType and entityId together",
});

export const versionListQuerySchema = z.strictObject({
  page: queryInteger.pipe(z.number().max(1_000_000)).optional(),
  limit: queryInteger.optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type DocumentEntityType = z.infer<typeof documentEntityTypeSchema>;
export type DocumentEntity = z.infer<typeof documentEntitySchema>;
export type DocumentTypeEnum = z.infer<typeof documentTypeSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type CreateDocumentVersionInput = z.infer<typeof createDocumentVersionSchema>;
export type DocumentListQuery = z.infer<typeof documentListQuerySchema>;
export type VersionListQuery = z.infer<typeof versionListQuerySchema>;

