import type { ResourceConfig } from '@/lib/fields'
import { stages } from './types'
export const applicationsConfig: ResourceConfig = {
  kind: 'applications',
  singular: 'application',
  title: 'Applications',
  nameKey: 'position',
  description: 'Every opportunity, with a clear next step.',
  defaultSort: 'updatedAt',
  sorts: ['position', 'dateApplied', 'createdAt', 'updatedAt'],
  columns: [
    { key: 'position', label: 'Position' },
    { key: 'companyId', label: 'Company' },
    { key: 'stage', label: 'Stage' },
    { key: 'dateApplied', label: 'Date applied' },
    { key: 'recruiter', label: 'Recruiter' },
  ],
  filters: [
    { key: 'companyId', label: 'Company', type: 'company' },
    { key: 'stage', label: 'Stage', options: stages },
    { key: 'dateAppliedFrom', label: 'Applied from', type: 'datetime' },
    { key: 'dateAppliedTo', label: 'Applied to', type: 'datetime' },
  ],
  fields: [
    { key: 'position', label: 'Position', required: true, min: 2, max: 200 },
    { key: 'companyId', label: 'Company', type: 'company', required: true },
    {
      key: 'stage',
      label: 'Initial stage',
      type: 'select',
      options: stages,
      default: 'WISHLIST',
      createOnly: true,
    },
    { key: 'timezone', label: 'Timezone', type: 'timezone', required: true },
    {
      key: 'dateApplied',
      label: 'Date applied',
      type: 'datetime',
      hint: 'Required from Applied through Offer.',
    },
    {
      key: 'recruiter',
      label: 'Recruiter',
      type: 'recruiter',
      hint: 'Choose a contact from the selected company.',
    },
    { key: 'salary', label: 'Salary', max: 200, hint: 'For example: USD 80,000–100,000 / year' },
    { key: 'notes', label: 'Notes', type: 'textarea', max: 20000, section: 'details' },
  ],
}
