import type { RecordBase } from '@/lib/api-types'
export const stages = [
  'WISHLIST',
  'APPLIED',
  'HR',
  'TECHNICAL',
  'ASSIGNMENT',
  'FINAL',
  'OFFER',
  'REJECTED',
  'ARCHIVED',
] as const
export type Stage = (typeof stages)[number]
export interface Application extends RecordBase {
  companyId: string
  position: string
  dateApplied: string | null
  salary: string | null
  timezone: string
  recruiter: string | null
  stage: Stage
  notes: string | null
}
export interface StageHistory {
  id: string
  applicationId: string
  fromStage: Stage | null
  toStage: Stage
  changedById: string
  createdAt: string
}
export const needsDate = (stage: string) => !['WISHLIST', 'REJECTED', 'ARCHIVED'].includes(stage)
