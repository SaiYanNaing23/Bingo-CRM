import { type CreateDocumentInput, type CreateDocumentVersionInput, type DocumentListQuery, type UpdateDocumentInput, type VersionListQuery } from "../dto/documents.dto";
export declare const validateDocumentId: (id: unknown) => string;
export declare const validateVersionId: (id: unknown) => string;
export declare const validateCreateDocument: (body: unknown) => CreateDocumentInput;
export declare const validateUpdateDocument: (body: unknown) => UpdateDocumentInput;
export declare const validateCreateDocumentVersion: (body: unknown) => CreateDocumentVersionInput;
export declare const validateDocumentListQuery: (query: unknown) => DocumentListQuery;
export declare const validateVersionListQuery: (query: unknown) => VersionListQuery;
//# sourceMappingURL=documents.validators.d.ts.map