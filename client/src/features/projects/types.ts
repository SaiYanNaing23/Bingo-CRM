import type { RecordBase } from '@/lib/api-types'

export const projectStatuses = [
  'PLANNED',
  'IN_PROGRESS',
  'ON_HOLD',
  'COMPLETED',
  'ARCHIVED',
] as const
export type ProjectStatus = (typeof projectStatuses)[number]
export interface Project extends RecordBase {
  name: string
  githubUrl: string | null
  liveDemoUrl: string | null
  status: ProjectStatus
  progress: number
  stack: string[]
  screenshots: string[]
  lessonsLearned: string | null
}
export interface ProjectActivity {
  id: string
  projectId: string
  createdById: string
  type: 'CREATED' | 'PROGRESS_UPDATE' | 'COMMENT'
  fromStatus: ProjectStatus | null
  toStatus: ProjectStatus | null
  fromProgress: number | null
  toProgress: number | null
  content: string | null
  createdAt: string
}
