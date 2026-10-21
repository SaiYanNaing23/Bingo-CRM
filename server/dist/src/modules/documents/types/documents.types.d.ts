import type { DocumentType } from "../../../generated/prisma/client";
import type { DocumentEntity } from "../dto/documents.dto";
export interface DocumentVersionItem {
    id: string;
    documentId: string;
    version: number;
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileUrl: string;
    storageProvider: string;
    storageKey: string | null;
    changelog: string | null;
    createdAt: Date;
    deletedAt: Date | null;
}
export interface StoredDocument {
    id: string;
    userId: string;
    title: string;
    type: DocumentType;
    description: string | null;
    tags: string[];
    companyId: string | null;
    contactId: string | null;
    applicationId: string | null;
    taskId: string | null;
    projectId: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    versions?: DocumentVersionItem[];
    _count?: {
        versions: number;
    };
}
export interface DocumentItem {
    id: string;
    userId: string;
    title: string;
    type: DocumentType;
    description: string | null;
    tags: string[];
    entity: DocumentEntity | null;
    entityAvailable: boolean | null;
    currentVersion: DocumentVersionItem | null;
    versionCount: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
export declare const documentSelect: {
    readonly id: true;
    readonly userId: true;
    readonly title: true;
    readonly type: true;
    readonly description: true;
    readonly tags: true;
    readonly companyId: true;
    readonly contactId: true;
    readonly applicationId: true;
    readonly taskId: true;
    readonly projectId: true;
    readonly createdAt: true;
    readonly updatedAt: true;
    readonly deletedAt: true;
};
export declare const documentVersionSelect: {
    readonly id: true;
    readonly documentId: true;
    readonly userId: true;
    readonly version: true;
    readonly fileName: true;
    readonly fileSize: true;
    readonly mimeType: true;
    readonly fileUrl: true;
    readonly storageProvider: true;
    readonly storageKey: true;
    readonly changelog: true;
    readonly createdAt: true;
    readonly deletedAt: true;
};
//# sourceMappingURL=documents.types.d.ts.map