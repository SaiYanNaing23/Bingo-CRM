import { describe, expect, it } from 'vitest'
import { formatBytes } from './config'
import {
  documentTypes,
  documentTypeLabels,
  type CreateDocumentInput,
  type CreateDocumentVersionInput,
  type DocumentItem,
} from './types'

describe('Documents feature logic and metadata formatting', () => {
  it('formats byte sizes into readable units', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1024 * 1024)).toBe('1 MB')
    expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB')
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB')
  })

  it('exposes labels for all document types', () => {
    documentTypes.forEach((type) => {
      expect(documentTypeLabels[type]).toBeDefined()
      expect(typeof documentTypeLabels[type]).toBe('string')
    })
  })

  it('correctly models CreateDocumentInput and version inputs', () => {
    const createPayload: CreateDocumentInput = {
      title: 'Senior Fullstack Resume 2026',
      type: 'RESUME',
      description: 'Updated with recent microservices experience',
      tags: ['typescript', 'react', 'node'],
      fileName: 'resume.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      fileUrl: 'https://storage.example.com/resume.pdf',
      entity: {
        type: 'APPLICATION',
        id: 'app-123',
      },
    }

    expect(createPayload.title).toBe('Senior Fullstack Resume 2026')
    expect(createPayload.fileSize).toBe(1048576)
    expect(createPayload.entity?.type).toBe('APPLICATION')

    const versionPayload: CreateDocumentVersionInput = {
      fileName: 'resume-v2.pdf',
      fileSize: 2097152,
      mimeType: 'application/pdf',
      fileUrl: 'https://storage.example.com/resume-v2.pdf',
      changelog: 'Added AWS certification',
    }

    expect((versionPayload as unknown as { version?: number }).version).toBeUndefined()
    expect(versionPayload.fileName).toBe('resume-v2.pdf')
  })

  it('correctly models DocumentItem with versioning and entity availability', () => {
    const doc: DocumentItem = {
      id: 'doc-1',
      userId: 'usr-1',
      deletedAt: null,
      title: 'Master Resume',
      type: 'RESUME',
      description: null,
      tags: ['master'],
      entity: null,
      entityAvailable: null,
      currentVersion: {
        id: 'ver-1',
        documentId: 'doc-1',
        version: 1,
        fileName: 'resume.pdf',
        fileSize: 500000,
        mimeType: 'application/pdf',
        fileUrl: 'https://storage.example.com/resume.pdf',
        storageProvider: 'uploadthing',
        storageKey: 'key-1',
        changelog: null,
        createdAt: new Date().toISOString(),
        deletedAt: null,
      },
      versionCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    expect(doc.versionCount).toBe(1)
    expect(doc.currentVersion?.version).toBe(1)
    expect(doc.currentVersion?.storageProvider).toBe('uploadthing')
  })
})
