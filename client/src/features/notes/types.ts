import type { RecordBase } from '@/lib/api-types'
export const entityKinds = {
  COMPANY: 'companies',
  CONTACT: 'contacts',
  APPLICATION: 'applications',
  TASK: 'tasks',
  PROJECT: 'projects',
} as const
export type EntityType = keyof typeof entityKinds
export type NoteEntity = { type: EntityType; id: string }
export interface Note extends RecordBase {
  title: string
  content: string
  tags: string[]
  entity: NoteEntity | null
  entityAvailable: boolean | null
}
