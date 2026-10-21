import { Prisma } from "../../../generated/prisma/client";
import { type DocumentEntity, type DocumentEntityType } from "../dto/documents.dto";
import type { DocumentItem, StoredDocument } from "../types/documents.types";
export declare const entityColumns: {
    readonly COMPANY: "companyId";
    readonly CONTACT: "contactId";
    readonly APPLICATION: "applicationId";
    readonly TASK: "taskId";
    readonly PROJECT: "projectId";
};
type EntityColumn = (typeof entityColumns)[DocumentEntityType];
export declare const entityFields: (entity: DocumentEntity | null) => Record<EntityColumn, string | null>;
export declare const requireDocumentEntity: (tx: Prisma.TransactionClient, entity: DocumentEntity, userId: string) => Promise<void>;
export declare const serializeDocuments: (tx: Prisma.TransactionClient, rows: StoredDocument[], userId: string) => Promise<DocumentItem[]>;
export {};
//# sourceMappingURL=documents.entities.d.ts.map