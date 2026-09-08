import { describe, expect, it } from 'vitest'
import { localInput, toTimestamp } from './dates'
describe('Timezone input conversion', () => {
  it('converts a chosen zone rather than the browser zone', () => {
    expect(toTimestamp('2026-09-08T09:00', 'Asia/Yangon')).toBe('2026-09-08T02:30:00.000Z')
    expect(localInput('2026-09-08T02:30:00.000Z', 'Asia/Yangon')).toBe('2026-09-08T09:00:00')
  })
  it('handles both sides of daylight saving and rejects nonexistent local times', () => {
    expect(toTimestamp('2026-03-07T09:00', 'America/New_York')).toBe('2026-03-07T14:00:00.000Z')
    expect(toTimestamp('2026-03-08T09:00', 'America/New_York')).toBe('2026-03-08T13:00:00.000Z')
    expect(() => toTimestamp('2026-03-08T02:30', 'America/New_York')).toThrow('does not exist')
    expect(
      localInput(toTimestamp('2026-11-01T01:30', 'America/New_York'), 'America/New_York'),
    ).toBe('2026-11-01T01:30:00')
  })
  it('rejects impossible calendar dates and invalid timezone names', () => {
    expect(() => toTimestamp('2026-02-30T10:00', 'UTC')).toThrow()
    expect(() => toTimestamp('2026-08-20T10:00', 'invalid-zone')).toThrow()
  })
})
