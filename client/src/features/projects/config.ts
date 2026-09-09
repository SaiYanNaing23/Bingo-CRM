import type { ResourceConfig } from '@/lib/fields'
import { projectStatuses } from './types'
export const projectsConfig: ResourceConfig = {
  kind: 'projects',
  singular: 'project',
  title: 'Projects',
  description: 'Build your portfolio, record progress, and keep the lessons that matter.',
  nameKey: 'name',
  defaultSort: 'updatedAt',
  sorts: ['name', 'progress', 'createdAt', 'updatedAt'],
  columns: [
    { key: 'name', label: 'Project' },
    { key: 'status', label: 'Status' },
    { key: 'progress', label: 'Progress' },
    { key: 'stack', label: 'Stack' },
    { key: 'updatedAt', label: 'Updated' },
  ],
  filters: [
    { key: 'status', label: 'Status', options: projectStatuses },
    { key: 'stack', label: 'Stack (exact entry)' },
  ],
  fields: [],
}
