import type { RecordBase } from '@/lib/api-types'
export interface Company extends RecordBase {
  name: string
  logo: string | null
  country: string | null
  industry: string | null
  website: string | null
  linkedIn: string | null
  careerPage: string | null
  techStack: string[]
  size: number | null
  salaryRange: string | null
  remote: boolean
  notes: string | null
  status: 'ACTIVE' | 'ARCHIVED'
}
