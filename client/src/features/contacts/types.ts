import type { RecordBase } from '@/lib/api-types'
export interface Contact extends RecordBase {
  name: string
  photo: string
  companyId: string
  email: string
  phone: string
  linkedIn: string
  role: string
  notes: string | null
  lastContactAt: string
  nextFollowUpAt: string
}
