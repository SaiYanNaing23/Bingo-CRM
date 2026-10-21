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

export const documentSelect = {
  id: true,
  userId: true,
  title: true,
  type: true,
  description: true,
  tags: true,
  companyId: true,
  contactId: true,
  applicationId: true,
  taskId: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

export const documentVersionSelect = {
  id: true,
  documentId: true,
  userId: true,
  version: true,
  fileName: true,
  fileSize: true,
  mimeType: true,
  fileUrl: true,
  storageProvider: true,
  storageKey: true,
  changelog: true,
  createdAt: true,
  deletedAt: true,
} as const;

