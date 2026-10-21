"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.versionListQuerySchema = exports.documentListQuerySchema = exports.versionIdSchema = exports.documentIdSchema = exports.createDocumentVersionSchema = exports.updateDocumentSchema = exports.createDocumentSchema = exports.documentTypeSchema = exports.documentTypes = exports.documentEntitySchema = exports.documentEntityTypeSchema = exports.documentEntityTypes = void 0;
const zod_1 = require("zod");
exports.documentEntityTypes = ["COMPANY", "CONTACT", "APPLICATION", "TASK", "PROJECT"];
exports.documentEntityTypeSchema = zod_1.z.enum(exports.documentEntityTypes);
exports.documentEntitySchema = zod_1.z.strictObject({ type: exports.documentEntityTypeSchema, id: zod_1.z.uuid() });
exports.documentTypes = [
    "RESUME",
    "COVER_LETTER",
    "CERTIFICATE",
    "ASSIGNMENT",
    "OFFER_LETTER",
    "CONTRACT",
    "OTHER",
];
exports.documentTypeSchema = zod_1.z.enum(exports.documentTypes);
const text = zod_1.z.string().refine(value => !value.includes("\0") && value.isWellFormed(), "Use valid Unicode text without NUL characters");
const tag = text.trim().min(1).max(40).toLowerCase();
const fileFields = {
    fileName: text.trim().min(1).max(255),
    fileSize: zod_1.z.coerce.number().int().positive().max(104_857_600, "Maximum file size is 100MB"),
    mimeType: text.trim().min(3).max(100),
    fileUrl: text.trim().min(1).max(2000),
    storageProvider: text.trim().min(1).max(50),
    storageKey: text.trim().max(500),
    changelog: text.trim().max(1000),
};
const metadataFields = {
    title: text.trim().min(2).max(200),
    type: exports.documentTypeSchema,
    description: text.trim().max(2000).nullable(),
    tags: zod_1.z.array(tag).max(20).transform(values => [...new Set(values)]),
    entity: exports.documentEntitySchema.nullable(),
};
exports.createDocumentSchema = zod_1.z.strictObject({
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
exports.updateDocumentSchema = zod_1.z.strictObject(metadataFields).partial().refine(value => Object.values(value).some(field => field !== undefined), "At least one document field is required");
exports.createDocumentVersionSchema = zod_1.z.strictObject({
    fileName: fileFields.fileName,
    fileSize: fileFields.fileSize,
    mimeType: fileFields.mimeType,
    fileUrl: fileFields.fileUrl,
    storageProvider: fileFields.storageProvider.default("METADATA"),
    storageKey: fileFields.storageKey.optional(),
    changelog: fileFields.changelog.optional(),
});
exports.documentIdSchema = zod_1.z.uuid();
exports.versionIdSchema = zod_1.z.uuid();
const queryInteger = zod_1.z.string().regex(/^\d+$/).pipe(zod_1.z.coerce.number().int().positive());
exports.documentListQuerySchema = zod_1.z.strictObject({
    page: queryInteger.pipe(zod_1.z.number().max(1_000_000)).optional(),
    limit: queryInteger.optional(),
    type: exports.documentTypeSchema.optional(),
    tag: tag.optional(),
    search: text.trim().max(200).optional(),
    entityType: exports.documentEntityTypeSchema.optional(),
    entityId: zod_1.z.uuid().optional(),
    sortBy: zod_1.z.enum(["title", "createdAt", "updatedAt"]).default("updatedAt"),
    order: zod_1.z.enum(["asc", "desc"]).default("desc"),
}).refine(value => (value.entityType === undefined) === (value.entityId === undefined), {
    path: ["entityId"],
    message: "Provide entityType and entityId together",
});
exports.versionListQuerySchema = zod_1.z.strictObject({
    page: queryInteger.pipe(zod_1.z.number().max(1_000_000)).optional(),
    limit: queryInteger.optional(),
    order: zod_1.z.enum(["asc", "desc"]).default("desc"),
});
//# sourceMappingURL=documents.dto.js.map