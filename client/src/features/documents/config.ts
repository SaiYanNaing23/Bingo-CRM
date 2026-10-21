import type { ResourceConfig } from '@/lib/fields'
import { documentTypes } from './types'

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export const documentsConfig: ResourceConfig = {
  kind: 'documents',
  singular: 'document',
  title: 'Documents',
  description: 'Upload, version, and manage your resumes, cover letters, certificates, and job documents.',
  nameKey: 'title',
  defaultSort: 'updatedAt',
  sorts: ['title', 'createdAt', 'updatedAt'],
  columns: [
    { key: 'title', label: 'Document' },
    { key: 'type', label: 'Category' },
    { key: 'currentVersion', label: 'Latest file' },
    { key: 'versionCount', label: 'Versions' },
    { key: 'tags', label: 'Tags' },
    { key: 'entity', label: 'Linked record' },
    { key: 'updatedAt', label: 'Updated' },
  ],
  filters: [
    {
      key: 'type',
      label: 'Category',
      type: 'select',
      options: documentTypes,
    },
    { key: 'tag', label: 'Tag (exact match)' },
  ],
  fields: [],
}
