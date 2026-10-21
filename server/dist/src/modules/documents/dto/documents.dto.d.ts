import { z } from "zod";
export declare const documentEntityTypes: readonly ["COMPANY", "CONTACT", "APPLICATION", "TASK", "PROJECT"];
export declare const documentEntityTypeSchema: z.ZodEnum<{
    PROJECT: "PROJECT";
    COMPANY: "COMPANY";
    CONTACT: "CONTACT";
    APPLICATION: "APPLICATION";
    TASK: "TASK";
}>;
export declare const documentEntitySchema: z.ZodObject<{
    type: z.ZodEnum<{
        PROJECT: "PROJECT";
        COMPANY: "COMPANY";
        CONTACT: "CONTACT";
        APPLICATION: "APPLICATION";
        TASK: "TASK";
    }>;
    id: z.ZodUUID;
}, z.core.$strict>;
export declare const documentTypes: readonly ["RESUME", "COVER_LETTER", "CERTIFICATE", "ASSIGNMENT", "OFFER_LETTER", "CONTRACT", "OTHER"];
export declare const documentTypeSchema: z.ZodEnum<{
    ASSIGNMENT: "ASSIGNMENT";
    OTHER: "OTHER";
    RESUME: "RESUME";
    COVER_LETTER: "COVER_LETTER";
    CERTIFICATE: "CERTIFICATE";
    OFFER_LETTER: "OFFER_LETTER";
    CONTRACT: "CONTRACT";
}>;
export declare const createDocumentSchema: z.ZodObject<{
    title: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<{
        ASSIGNMENT: "ASSIGNMENT";
        OTHER: "OTHER";
        RESUME: "RESUME";
        COVER_LETTER: "COVER_LETTER";
        CERTIFICATE: "CERTIFICATE";
        OFFER_LETTER: "OFFER_LETTER";
        CONTRACT: "CONTRACT";
    }>>;
    description: z.ZodDefault<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    tags: z.ZodDefault<z.ZodPipe<z.ZodArray<z.ZodString>, z.ZodTransform<string[], string[]>>>;
    entity: z.ZodDefault<z.ZodNullable<z.ZodObject<{
        type: z.ZodEnum<{
            PROJECT: "PROJECT";
            COMPANY: "COMPANY";
            CONTACT: "CONTACT";
            APPLICATION: "APPLICATION";
            TASK: "TASK";
        }>;
        id: z.ZodUUID;
    }, z.core.$strict>>>;
    fileName: z.ZodString;
    fileSize: z.ZodCoercedNumber<unknown>;
    mimeType: z.ZodString;
    fileUrl: z.ZodString;
    storageProvider: z.ZodDefault<z.ZodString>;
    storageKey: z.ZodOptional<z.ZodString>;
    changelog: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const updateDocumentSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<{
        ASSIGNMENT: "ASSIGNMENT";
        OTHER: "OTHER";
        RESUME: "RESUME";
        COVER_LETTER: "COVER_LETTER";
        CERTIFICATE: "CERTIFICATE";
        OFFER_LETTER: "OFFER_LETTER";
        CONTRACT: "CONTRACT";
    }>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    tags: z.ZodOptional<z.ZodPipe<z.ZodArray<z.ZodString>, z.ZodTransform<string[], string[]>>>;
    entity: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        type: z.ZodEnum<{
            PROJECT: "PROJECT";
            COMPANY: "COMPANY";
            CONTACT: "CONTACT";
            APPLICATION: "APPLICATION";
            TASK: "TASK";
        }>;
        id: z.ZodUUID;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export declare const createDocumentVersionSchema: z.ZodObject<{
    fileName: z.ZodString;
    fileSize: z.ZodCoercedNumber<unknown>;
    mimeType: z.ZodString;
    fileUrl: z.ZodString;
    storageProvider: z.ZodDefault<z.ZodString>;
    storageKey: z.ZodOptional<z.ZodString>;
    changelog: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const documentIdSchema: z.ZodUUID;
export declare const versionIdSchema: z.ZodUUID;
export declare const documentListQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodCoercedNumber<string>>, z.ZodNumber>>;
    limit: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodCoercedNumber<string>>>;
    type: z.ZodOptional<z.ZodEnum<{
        ASSIGNMENT: "ASSIGNMENT";
        OTHER: "OTHER";
        RESUME: "RESUME";
        COVER_LETTER: "COVER_LETTER";
        CERTIFICATE: "CERTIFICATE";
        OFFER_LETTER: "OFFER_LETTER";
        CONTRACT: "CONTRACT";
    }>>;
    tag: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    entityType: z.ZodOptional<z.ZodEnum<{
        PROJECT: "PROJECT";
        COMPANY: "COMPANY";
        CONTACT: "CONTACT";
        APPLICATION: "APPLICATION";
        TASK: "TASK";
    }>>;
    entityId: z.ZodOptional<z.ZodUUID>;
    sortBy: z.ZodDefault<z.ZodEnum<{
        createdAt: "createdAt";
        updatedAt: "updatedAt";
        title: "title";
    }>>;
    order: z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
}, z.core.$strict>;
export declare const versionListQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodCoercedNumber<string>>, z.ZodNumber>>;
    limit: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodCoercedNumber<string>>>;
    order: z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
}, z.core.$strict>;
export type DocumentEntityType = z.infer<typeof documentEntityTypeSchema>;
export type DocumentEntity = z.infer<typeof documentEntitySchema>;
export type DocumentTypeEnum = z.infer<typeof documentTypeSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type CreateDocumentVersionInput = z.infer<typeof createDocumentVersionSchema>;
export type DocumentListQuery = z.infer<typeof documentListQuerySchema>;
export type VersionListQuery = z.infer<typeof versionListQuerySchema>;
//# sourceMappingURL=documents.dto.d.ts.map