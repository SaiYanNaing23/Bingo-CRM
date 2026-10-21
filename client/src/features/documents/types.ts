import type { RecordBase } from '@/lib/api-types'
import type { Kind } from '@/lib/resources'

export const documentTypes = [
  'RESUME',
  'COVER_LETTER',
  'CERTIFICATE',
  'ASSIGNMENT',
  'OFFER_LETTER',
  'CONTRACT',
  'OTHER',
] as const

export type DocumentType = (typeof documentTypes)[number]

export const documentTypeLabels: Record<DocumentType, string> = {
  RESUME: 'Resume',
  COVER_LETTER: 'Cover letter',
  CERTIFICATE: 'Certificate',
  ASSIGNMENT: 'Assignment',
  OFFER_LETTER: 'Offer letter',
  CONTRACT: 'Contract',
  OTHER: 'Other',
}

export type DocumentEntityType = 'COMPANY' | 'CONTACT' | 'APPLICATION' | 'TASK' | 'PROJECT'

export interface DocumentEntity {
  type: DocumentEntityType
  id: string
}

export const entityKinds: Record<DocumentEntityType, Kind> = {
  COMPANY: 'companies',
  CONTACT: 'contacts',
  APPLICATION: 'applications',
  TASK: 'tasks',
  PROJECT: 'projects',
}

export interface DocumentVersionItem {
  id: string
  documentId: string
  version: number
  fileName: string
  fileSize: number
  mimeType: string
  fileUrl: string
  storageProvider: string
  storageKey: string | null
  changelog: string | null
  createdAt: string
  deletedAt: string | null
}

export interface DocumentItem extends RecordBase {
  title: string
  type: DocumentType
  description: string | null
  tags: string[]
  entity: DocumentEntity | null
  entityAvailable: boolean | null
  currentVersion: DocumentVersionItem | null
  versionCount: number
}

export interface CreateDocumentInput {
  title: string
  type?: DocumentType
  description?: string | null
  tags?: string[]
  entity?: DocumentEntity | null
  fileName: string
  fileSize: number
  mimeType: string
  fileUrl: string
  storageProvider?: string
  storageKey?: string
  changelog?: string
}

export interface UpdateDocumentInput {
  title?: string
  type?: DocumentType
  description?: string | null
  tags?: string[]
  entity?: DocumentEntity | null
}

export interface CreateDocumentVersionInput {
  fileName: string
  fileSize: number
  mimeType: string
  fileUrl: string
  storageProvider?: string
  storageKey?: string
  changelog?: string
}

