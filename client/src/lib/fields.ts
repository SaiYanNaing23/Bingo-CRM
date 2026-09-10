import type { Kind } from './resources'
export interface Field {
  key: string
  label: string
  type?:
    | 'text'
    | 'email'
    | 'url'
    | 'number'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'datetime'
    | 'company'
    | 'recruiter'
    | 'timezone'
  required?: boolean
  min?: number
  max?: number
  options?: readonly string[]
  default?: string | boolean
  hint?: string
  section?: 'details'
  createOnly?: boolean
  array?: boolean
}
export interface ResourceConfig {
  kind: Kind
  singular: string
  title: string
  description: string
  nameKey: string
  fields: Field[]
  columns: { key: string; label: string }[]
  filters: Field[]
  sorts: string[]
  defaultSort: string
}
export const friendly = (value: string) =>
  ({
    TODO: 'To do',
    IN_PROGRESS: 'In progress',
    HR: 'HR',
    NONE: 'Does not repeat',
    JOB_APPLICATION: 'Job application',
  FOLLOW_UP: 'Follow-up',
  INTERVIEW: 'Interview',
  DEADLINE: 'Deadline',
  OTHER: 'Other',
  })[value] ||
  value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^./, (c) => c.toUpperCase())
