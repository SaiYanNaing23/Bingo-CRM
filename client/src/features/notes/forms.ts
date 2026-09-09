import { z } from 'zod'
import { entityKinds, type EntityType, type Note, type NoteEntity } from './types'
const validText = (value: string) => !value.includes('\0') && !/[\uD800-\uDFFF]/u.test(value)
export const noteFormSchema = z
  .object({
    title: z.string().trim().min(2, 'Use at least 2 characters.').max(200),
    content: z
      .string()
      .max(100000)
      .refine((value) => value.trim().length > 0, 'Write some content before saving.'),
    tags: z.string(),
    entityType: z.string(),
    entityId: z.string(),
  })
  .superRefine((values, ctx) => {
    const issue = (key: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [key], message })
    for (const key of ['title', 'content', 'tags'] as const)
      if (!validText(values[key])) issue(key, 'Use valid Unicode text without NUL characters.')
    const tags = tagEntries(values.tags)
    if (tags.length > 20 || tags.some((tag) => tag.length > 40))
      issue('tags', 'Use up to 20 tags, each at most 40 characters.')
    if (
      values.entityType &&
      (!Object.hasOwn(entityKinds, values.entityType) ||
        !z.uuid().safeParse(values.entityId).success)
    )
      issue('entityId', 'Choose a linked record, or select Standalone.')
    if (!values.entityType && values.entityId) issue('entityId', 'Choose the record type first.')
  })
export const tagEntries = (value: string) =>
  value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
export type NoteValues = z.infer<typeof noteFormSchema>
const editorSource = (content: string) => content.replace(/\r\n?/g, '\n')
export function noteValues(record?: Note, entity?: NoteEntity | null): NoteValues {
  const link = record ? record.entity : entity
  return {
    title: record?.title ?? '',
    content: editorSource(record?.content ?? ''),
    tags: record?.tags.join('\n') ?? '',
    entityType: link?.type ?? '',
    entityId: link?.id ?? '',
  }
}
export function notePayload(values: NoteValues, record?: Note): Record<string, unknown> {
  const entity = values.entityType
    ? { type: values.entityType as EntityType, id: values.entityId }
    : null
  if (!record)
    return {
      title: values.title.trim(),
      content: values.content,
      tags: tagEntries(values.tags),
      entity,
    }
  const initial = noteValues(record)
  const body: Record<string, unknown> = {}
  if (values.title !== initial.title) body.title = values.title.trim()
  if (values.content !== initial.content) body.content = values.content
  if (values.tags !== initial.tags) body.tags = tagEntries(values.tags)
  if (values.entityType !== initial.entityType || values.entityId !== initial.entityId)
    body.entity = entity
  // Omit unchanged Markdown and links: retain original line endings and allow edits after target deletion.
  return Object.keys(body).length ? body : { title: record.title }
}
export function entityFromParams(params: URLSearchParams): NoteEntity | null {
  const type = params.get('entityType'),
    id = params.get('entityId')
  return type && Object.hasOwn(entityKinds, type) && id && z.uuid().safeParse(id).success
    ? { type: type as EntityType, id }
    : null
}
