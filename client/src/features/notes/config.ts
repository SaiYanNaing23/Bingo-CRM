import type { ResourceConfig } from '@/lib/fields'
export const notesConfig: ResourceConfig = {
  kind: 'notes',
  singular: 'note',
  title: 'Notes',
  description: 'A place for ideas, decisions, and the details worth remembering.',
  nameKey: 'title',
  defaultSort: 'updatedAt',
  sorts: ['title', 'createdAt', 'updatedAt'],
  columns: [
    { key: 'title', label: 'Note' },
    { key: 'tags', label: 'Tags' },
    { key: 'entity', label: 'Linked record' },
    { key: 'updatedAt', label: 'Updated' },
  ],
  filters: [{ key: 'tag', label: 'Tag (exact match)' }],
  fields: [],
}
