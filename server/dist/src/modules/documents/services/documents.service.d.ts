import type { CreateDocumentInput, CreateDocumentVersionInput, DocumentListQuery, UpdateDocumentInput, VersionListQuery } from "../dto/documents.dto";
import { type DocumentItem, type DocumentVersionItem } from "../types/documents.types";
export declare const createDocument: (input: CreateDocumentInput, userId: string) => Promise<DocumentItem>;
export declare const getDocument: (id: string, userId: string) => Promise<DocumentItem>;
export declare const updateDocument: (id: string, input: UpdateDocumentInput, userId: string) => Promise<DocumentItem>;
export declare const deleteDocument: (id: string, userId: string) => Promise<void>;
export declare const listDocuments: (query: DocumentListQuery, userId: string) => Promise<{
    data: DocumentItem[];
    meta: import("../../../shared/types/api-response").PaginationMeta;
}>;
export declare const addDocumentVersion: (documentId: string, input: CreateDocumentVersionInput, userId: string) => Promise<DocumentVersionItem>;
export declare const listDocumentVersions: (documentId: string, query: VersionListQuery, userId: string) => Promise<{
    data: {
        id: string;
        createdAt: Date;
        deletedAt: Date | null;
        userId: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
        fileUrl: string;
        storageProvider: string;
        storageKey: string | null;
        changelog: string | null;
        documentId: string;
        version: number;
    }[];
    meta: import("../../../shared/types/api-response").PaginationMeta;
}>;
export declare const deleteDocumentVersion: (documentId: string, versionId: string, userId: string) => Promise<void>;
//# sourceMappingURL=documents.service.d.ts.map