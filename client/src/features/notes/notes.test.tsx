import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MarkdownPreview } from './markdown-preview'
import { noteFormSchema, notePayload, noteValues, entityFromParams } from './forms'
import type { Note } from './types'
const projectId = '11111111-1111-4111-8111-111111111111'
const note: Note = {
  id: 'n',
  userId: 'u',
  createdAt: '',
  updatedAt: '',
  deletedAt: null,
  title: 'Saved note',
  content: '  # Exact\r\n\r\n```ts\r\n  const x = 1\r\n```\r\n',
  tags: ['tag,with-comma'],
  entity: { type: 'PROJECT', id: projectId },
  entityAvailable: false,
}
describe('Notes source and linking contract', () => {
  it('keeps original CRLF source and unavailable link untouched when editing a title', () => {
    expect(noteValues(note).content).toBe(note.content.replaceAll('\r\n', '\n'))
    expect(notePayload({ ...noteValues(note), title: 'Changed title' }, note)).toEqual({
      title: 'Changed title',
    })
    const source = '\n  code  \n\n日本語 🙂\n'
    expect(notePayload({ ...noteValues(), title: 'New title', content: source })).toMatchObject({
      content: source,
      entity: null,
      tags: [],
    })
    expect(notePayload({ ...noteValues(note), content: source }, note)).toEqual({ content: source })
  })
  it('replaces tags, detaches explicitly, rebinds a single pair, and omits unchanged values', () => {
    expect(notePayload({ ...noteValues(note), tags: '' }, note)).toEqual({ tags: [] })
    expect(notePayload({ ...noteValues(note), entityType: '', entityId: '' }, note)).toEqual({
      entity: null,
    })
    expect(notePayload({ ...noteValues(note), entityType: 'TASK' }, note)).toEqual({
      entity: { type: 'TASK', id: projectId },
    })
    expect(notePayload(noteValues(note), note)).toEqual({ title: note.title })
  })
  it('rejects incomplete/invalid links, malformed Unicode, blank/oversize content and tag limits', () => {
    const initial = noteValues(note)
    expect(noteFormSchema.safeParse(initial).success).toBe(true)
    for (const change of [
      { content: '  \n' },
      { content: 'x'.repeat(100001) },
      { content: '\0' },
      { title: 'bad\ud800' },
      { tags: 'x'.repeat(41) },
      { tags: Array(21).fill('tag').join('\n') },
      { entityType: 'constructor' },
      { entityId: '' },
      { entityType: '', entityId: projectId },
    ])
      expect(noteFormSchema.safeParse({ ...initial, ...change }).success).toBe(false)
    expect(noteFormSchema.safeParse({ ...initial, content: '🙂'.repeat(50000) }).success).toBe(true)
    for (const query of [
      'entityType=PROJECT',
      'entityType=PROJECT&entityId=bad',
      `entityType=constructor&entityId=${projectId}`,
    ])
      expect(entityFromParams(new URLSearchParams(query))).toBeNull()
  })
})
describe('Markdown preview', () => {
  it('renders headings, code, tables and task lists without executing HTML or unsafe links or loading images', () => {
    const { container } = render(
      <MarkdownPreview
        content={
          '# Review\n\n```js\n  const safe = true\n```\n\n| One | Two |\n| --- | --- |\n| A | B |\n\n- [x] Finished\n\n<script>window.evil = true</script>\n\n<img src="x" onerror="alert(1)">\n\n[Bad](javascript:alert%281%29) [Data](data:text/html,bad) [Relative](/logout) [Good](https://example.com)\n\n![Screenshot](https://example.com/tracker.png)'
        }
      />,
    )
    expect(screen.getByRole('heading', { name: 'Review' })).toBeVisible()
    expect(screen.getByRole('table')).toBeVisible()
    expect(screen.getByRole('checkbox')).toBeDisabled()
    expect(container.querySelector('pre code')?.textContent).toBe('  const safe = true\n')
    expect(container.querySelector('script, img, iframe, [onerror]')).toBeNull()
    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      'https://example.com',
      'https://example.com/tracker.png',
    ])
    expect(screen.getByRole('link', { name: 'Good' })).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
