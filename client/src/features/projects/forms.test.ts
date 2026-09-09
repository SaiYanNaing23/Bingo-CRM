import { describe, expect, it } from 'vitest'
import { projectFormSchema, projectPayload, projectValues, validProjectState } from './forms'
import type { Project } from './types'
import { safeReturnPath } from '@/lib/api-client'
const record: Project = {
  id: 'p',
  userId: 'u',
  createdAt: '',
  updatedAt: '',
  deletedAt: null,
  name: 'Portfolio',
  status: 'COMPLETED',
  progress: 100,
  githubUrl: 'https://example.com/repo',
  liveDemoUrl: null,
  stack: ['React', 'comma,entry'],
  screenshots: ['https://example.com/a,b.png'],
  lessonsLearned: '  Keep indentation\r\n',
}
describe('Projects form contract', () => {
  it('accepts zero, whole percentages, and only consistent status/progress pairs', () => {
    for (const [status, valid] of Object.entries({
      PLANNED: [0],
      IN_PROGRESS: [0, 40, 99],
      ON_HOLD: [0, 40, 99],
      COMPLETED: [100],
      ARCHIVED: [0, 40, 99, 100],
    })) {
      for (const progress of [-1, 0, 40, 99, 100, 101, 1.5, NaN])
        expect(validProjectState(status as Project['status'], progress)).toBe(
          valid.includes(progress),
        )
    }
    expect(
      projectFormSchema(false).safeParse({ ...projectValues(), name: 'Valid name', progress: '' })
        .success,
    ).toBe(false)
    expect(projectPayload({ ...projectValues(), name: 'Valid name' })).toMatchObject({
      progress: 0,
      status: 'PLANNED',
    })
  })
  it('omits server fields, progress/status and unchanged metadata from PUT, and clears fields explicitly', () => {
    const initial = projectValues(record)
    expect(projectPayload({ ...initial, name: 'Renamed' }, record)).toEqual({ name: 'Renamed' })
    expect(
      projectPayload(
        { ...initial, githubUrl: '', stack: '', screenshots: '', lessonsLearned: '' },
        record,
      ),
    ).toEqual({ githubUrl: null, stack: [], screenshots: [], lessonsLearned: null })
    expect(
      projectPayload(
        { ...initial, screenshots: 'https://example.com/a,b.png\nhttps://example.com/two.png' },
        record,
      ),
    ).toEqual({ screenshots: ['https://example.com/a,b.png', 'https://example.com/two.png'] })
  })
  it('validates URL and entry limits without rejecting an archived project detail edit', () => {
    const initial = projectValues(record)
    expect(projectFormSchema(true).safeParse(initial).success).toBe(true)
    for (const change of [
      { githubUrl: 'javascript:alert(1)' },
      { screenshots: '[link](https://example.com)' },
      { stack: 'x'.repeat(51) },
      { stack: Array(31).fill('react').join('\n') },
    ])
      expect(projectFormSchema(true).safeParse({ ...initial, ...change }).success).toBe(false)
  })
  it('keeps safe Projects/Notes return filters while rejecting external paths', () => {
    for (const path of ['/projects?status=ARCHIVED&page=2', '/notes?tag=work', '/notes/123/edit'])
      expect(safeReturnPath(path)).toBe(path)
    for (const path of ['//example.com', '/projects\\example.com', '/projects-evil'])
      expect(safeReturnPath(path)).toBe('/companies')
  })
})
