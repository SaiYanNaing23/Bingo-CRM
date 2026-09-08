import { z } from 'zod'
import type { ResourceConfig } from './fields'
import { browserTimezone, isTimezone, localInput, toTimestamp } from './dates'
import { type Entity, valueOf } from './resources'
import { needsDate } from '@/features/applications/types'
export type FormValues = Record<string, string | boolean>
export function initialValues(config: ResourceConfig, record?: Entity): FormValues {
  const zone = (record && (valueOf(record, 'timezone') as string)) || browserTimezone()
  return Object.fromEntries(
    config.fields.map((field) => {
      const value = record ? valueOf(record, field.key) : undefined
      return [
        field.key,
        field.type === 'timezone'
          ? zone
          : field.type === 'datetime'
            ? localInput(value as string, zone)
            : field.array
              ? ((value as string[] | undefined)?.join(', ') ?? '')
              : value === null || value === undefined
                ? (field.default ?? '')
                : typeof value === 'boolean'
                  ? value
                  : String(value),
      ]
    }),
  )
}
export function formSchema(config: ResourceConfig, record?: Entity) {
  return z.record(z.string(), z.union([z.string(), z.boolean()])).superRefine((values, ctx) => {
    const add = (key: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [key], message })
    const zone = String(values.timezone || values._timezone || browserTimezone())
    for (const field of config.fields) {
      if (record && field.createOnly) continue
      const value = String(values[field.key] ?? '').trim()
      if (field.required && !value) {
        add(field.key, `${field.label} is required.`)
        continue
      }
      if (!value) continue
      if (field.min && value.length < field.min)
        add(field.key, `Use at least ${field.min} characters.`)
      if (field.max && value.length > field.max)
        add(field.key, `Use no more than ${field.max} characters.`)
      if (field.type === 'url') {
        try {
          if (!['https:', 'http:'].includes(new URL(value).protocol)) throw new Error()
        } catch {
          add(field.key, 'Enter a plain http:// or https:// URL.')
        }
      }
      if (field.type === 'email' && !z.email().safeParse(value).success)
        add(field.key, 'Enter a valid email address.')
      if (field.type === 'number' && (!Number.isSafeInteger(Number(value)) || Number(value) <= 0))
        add(field.key, 'Enter a positive whole number.')
      if (field.type === 'timezone' && !isTimezone(value))
        add(field.key, 'Use a named timezone, such as Asia/Yangon or UTC.')
      if (field.type === 'datetime') {
        try {
          toTimestamp(value, zone)
        } catch (error) {
          add(field.key, (error as Error).message)
        }
      }
      if (field.options && !field.options.includes(value))
        add(field.key, 'Choose an available option.')
    }
    if (
      config.kind === 'applications' &&
      needsDate(String(record ? valueOf(record, 'stage') : values.stage)) &&
      !values.dateApplied
    )
      add('dateApplied', 'Date applied is required for this stage.')
    if (config.kind === 'tasks' && values.repeatPattern !== 'NONE' && !values.dueDate)
      add('dueDate', 'A repeating task needs a due date.')
  })
}
export function toPayload(
  config: ResourceConfig,
  values: FormValues,
  record?: Entity,
): Record<string, unknown> {
  const zone = String(values.timezone || values._timezone || browserTimezone())
  const initial = initialValues(config, record)
  const originalZone = (record && valueOf(record, 'timezone')) || browserTimezone()
  return Object.fromEntries(
    config.fields
      .filter((field) => !field.key.startsWith('_') && !(record && field.createOnly))
      .map((field) => {
        const raw = values[field.key]
        const value = typeof raw === 'string' ? raw.trim() : raw
        if (field.type === 'checkbox') return [field.key, !!value]
        if (field.array)
          return [
            field.key,
            String(value || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          ]
        if (field.type === 'datetime')
          return [
            field.key,
            !value
              ? null
              : record &&
                  (String(value).length === 16 ? `${value}:00` : value) === initial[field.key] &&
                  zone === originalZone
                ? valueOf(record, field.key)
                : toTimestamp(String(value), zone),
          ]
        if (field.type === 'number') return [field.key, value ? Number(value) : null]
        return [field.key, value || null]
      }),
  )
}
