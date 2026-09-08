import { describe, expect, it } from 'vitest'
import { initialValues, formSchema, toPayload } from './forms'
import { applicationsConfig } from '@/features/applications/config'
import { companiesConfig } from '@/features/companies/config'
import { contactsConfig } from '@/features/contacts/config'
import { tasksConfig } from '@/features/tasks/config'
import type { Application } from '@/features/applications/types'
describe('Form and API contracts', () => {
  it('requires every contact field and rejects Markdown URLs and escaped emails', () => {
    const values = {
      ...initialValues(contactsConfig),
      name: 'Sarah Johnson',
      companyId: 'a-company',
      email: 'sarah@example.com',
      phone: '+1 234 567 8900',
      role: 'Recruiter',
      photo: 'https://example.com/photo.jpg',
      linkedIn: 'https://linkedin.com/in/sarah',
      _timezone: 'UTC',
      lastContactAt: '2026-09-08T09:00',
      nextFollowUpAt: '2026-09-09T09:00',
    }
    expect(formSchema(contactsConfig).safeParse(values).success).toBe(true)
    expect(
      formSchema(contactsConfig).safeParse({
        ...values,
        photo: '[https://example.com](https://example.com)',
      }).success,
    ).toBe(false)
    expect(
      formSchema(contactsConfig).safeParse({ ...values, email: 'sarah\\@example.com' }).success,
    ).toBe(false)
    expect(formSchema(contactsConfig).safeParse({ ...values, phone: '' }).success).toBe(false)
    const payload = toPayload(contactsConfig, values)
    expect(payload).not.toHaveProperty('_timezone')
    expect(payload.lastContactAt).toBe('2026-09-08T09:00:00.000Z')
  })
  it('does not send stage/owner/lifecycle on detail edits and preserves unchanged instants', () => {
    const record: Application = {
      id: 'a',
      userId: 'u',
      companyId: 'c',
      position: 'Engineer',
      dateApplied: '2026-11-01T06:30:00.123Z',
      timezone: 'America/New_York',
      stage: 'APPLIED',
      salary: null,
      recruiter: null,
      notes: null,
      createdAt: '',
      updatedAt: '',
      deletedAt: null,
    }
    const payload = toPayload(
      applicationsConfig,
      { ...initialValues(applicationsConfig, record), position: 'Senior Engineer' },
      record,
    )
    expect(payload.dateApplied).toBe(record.dateApplied)
    expect(payload).not.toHaveProperty('stage')
    expect(payload).not.toHaveProperty('userId')
    expect(payload).not.toHaveProperty('deletedAt')
    expect(payload.salary).toBeNull()
    const browserValues = initialValues(applicationsConfig, record)
    browserValues.dateApplied = String(browserValues.dateApplied).slice(0, 16)
    expect(toPayload(applicationsConfig, browserValues, record).dateApplied).toBe(
      record.dateApplied,
    )
  })
  it('enforces stage and recurrence prerequisites and excludes completion from task edits', () => {
    const application = {
      ...initialValues(applicationsConfig),
      companyId: 'c',
      position: 'Engineer',
      stage: 'APPLIED',
      timezone: 'UTC',
    }
    expect(formSchema(applicationsConfig).safeParse(application).success).toBe(false)
    const task = {
      ...initialValues(tasksConfig),
      title: 'Follow up',
      repeatPattern: 'DAILY',
      timezone: 'UTC',
    }
    expect(formSchema(tasksConfig).safeParse(task).success).toBe(false)
    expect(
      formSchema(tasksConfig).safeParse({ ...task, repeatPattern: 'NONE', status: 'COMPLETED' })
        .success,
    ).toBe(false)
  })
  it('converts optional company numbers and comma-separated technologies correctly', () => {
    const payload = toPayload(companiesConfig, {
      ...initialValues(companiesConfig),
      name: 'Paperplane',
      size: '24',
      techStack: 'React, TypeScript, ',
      remote: true,
    })
    expect(payload).toMatchObject({
      size: 24,
      techStack: ['React', 'TypeScript'],
      remote: true,
      website: null,
    })
  })
})
