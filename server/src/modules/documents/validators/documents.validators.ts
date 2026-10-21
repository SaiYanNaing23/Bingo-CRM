import {
  createDocumentSchema,
  createDocumentVersionSchema,
  documentIdSchema,
  documentListQuerySchema,
  updateDocumentSchema,
  versionIdSchema,
  versionListQuerySchema,
  type CreateDocumentInput,
  type CreateDocumentVersionInput,
  type DocumentListQuery,
  type UpdateDocumentInput,
  type VersionListQuery,
} from "../dto/documents.dto";

export const validateDocumentId = (id: unknown): string => documentIdSchema.parse(id);
export const validateVersionId = (id: unknown): string => versionIdSchema.parse(id);

export const validateCreateDocument = (body: unknown): CreateDocumentInput => createDocumentSchema.parse(body);
export const validateUpdateDocument = (body: unknown): UpdateDocumentInput => updateDocumentSchema.parse(body);

export const validateCreateDocumentVersion = (body: unknown): CreateDocumentVersionInput =>
  createDocumentVersionSchema.parse(body);

export const validateDocumentListQuery = (query: unknown): DocumentListQuery =>
  documentListQuerySchema.parse(query);

export const validateVersionListQuery = (query: unknown): VersionListQuery =>
  versionListQuerySchema.parse(query);

