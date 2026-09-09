import { z } from 'zod'
import { projectStatuses, type Project, type ProjectStatus } from './types'

export const entries = (value: string) =>
  value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
export function validProjectState(status: ProjectStatus, progress: number) {
  return (
    Number.isInteger(progress) &&
    progress >= 0 &&
    progress <= 100 &&
    (status === 'PLANNED'
      ? progress === 0
      : status === 'COMPLETED'
        ? progress === 100
        : status === 'ARCHIVED' || progress < 100)
  )
}
export const stateHint =
  'Planned: 0%. In progress / On hold: 0–99%. Completed: 100%. Archived: 0–100%.'
export function safeHttpUrl(value: string) {
  try {
    return /^https?:\/\//i.test(value) && ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}
const textFields = {
  name: z.string().trim().min(2, 'Use at least 2 characters.').max(200),
  githubUrl: z.string(),
  liveDemoUrl: z.string(),
  stack: z.string(),
  screenshots: z.string(),
  lessonsLearned: z.string().max(50000),
  status: z.enum(projectStatuses),
  progress: z.string(),
}
export const projectFormSchema = (editing: boolean) =>
  z.object(textFields).superRefine((values, ctx) => {
    const issue = (key: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [key], message })
    for (const key of ['githubUrl', 'liveDemoUrl'] as const) {
      const url = values[key].trim()
      if (url && (url.length > 2048 || !safeHttpUrl(url)))
        issue(key, 'Use a plain HTTP(S) URL up to 2,048 characters.')
    }
    const stack = entries(values.stack),
      screenshots = entries(values.screenshots)
    if (stack.length > 30 || stack.some((s) => s.length > 50))
      issue('stack', 'Use up to 30 entries, each at most 50 characters.')
    if (screenshots.length > 20 || screenshots.some((s) => s.length > 2048 || !safeHttpUrl(s)))
      issue('screenshots', 'Use up to 20 plain HTTP(S) URLs, each at most 2,048 characters.')
    if (
      !editing &&
      (!values.progress.trim() || !validProjectState(values.status, Number(values.progress)))
    )
      issue('progress', stateHint)
  })
export type ProjectValues = z.input<ReturnType<typeof projectFormSchema>>
export function projectValues(record?: Project): ProjectValues {
  return {
    name: record?.name ?? '',
    githubUrl: record?.githubUrl ?? '',
    liveDemoUrl: record?.liveDemoUrl ?? '',
    stack: record?.stack.join('\n') ?? '',
    screenshots: record?.screenshots.join('\n') ?? '',
    lessonsLearned: record?.lessonsLearned ?? '',
    status: record?.status ?? 'PLANNED',
    progress: String(record?.progress ?? 0),
  }
}
export function projectPayload(values: ProjectValues, record?: Project): Record<string, unknown> {
  const initial = projectValues(record)
  const details = {
    name: values.name.trim(),
    githubUrl: values.githubUrl.trim() || null,
    liveDemoUrl: values.liveDemoUrl.trim() || null,
    stack: entries(values.stack),
    screenshots: entries(values.screenshots),
    lessonsLearned: values.lessonsLearned || null,
  }
  if (!record) return { ...details, status: values.status, progress: Number(values.progress) }
  const changed = Object.fromEntries(
    Object.entries(details).filter(
      ([key]) => values[key as keyof ProjectValues] !== initial[key as keyof ProjectValues],
    ),
  )
  return Object.keys(changed).length ? changed : { name: record.name }
}
