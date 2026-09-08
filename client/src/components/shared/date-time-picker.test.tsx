import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DateTimePicker } from './date-time-picker'
import { toTimestamp } from '@/lib/dates'

function Field({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial)
  return (
    <>
      <DateTimePicker id="due" label="Due date" value={value} onChange={setValue} />
      <output>{value}</output>
    </>
  )
}
describe('date and time entry', () => {
  it('keeps seconds while changing the calendar date and converts only in the chosen timezone', () => {
    render(<Field initial="2026-09-08T10:15:37" />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Due date' }), {
      target: { value: '2027-02-28' },
    })
    const value = screen.getByRole('status').textContent!
    expect(value).toBe('2027-02-28T10:15:37')
    expect(toTimestamp(value, 'Asia/Yangon')).toBe('2027-02-28T03:45:37.000Z')
  })
  it('does not invent a date when time is entered first and allows clearing an optional timestamp', () => {
    render(<Field />)
    fireEvent.change(screen.getByLabelText('Due date time'), { target: { value: '14:30' } })
    expect(screen.getByRole('textbox', { name: 'Due date' })).toHaveValue('')
    expect(() => toTimestamp(screen.getByRole('status').textContent!, 'UTC')).toThrow(
      'complete date',
    )
    fireEvent.change(screen.getByRole('textbox', { name: 'Due date' }), {
      target: { value: '2026-09-08' },
    })
    expect(screen.getByRole('status')).toHaveTextContent('2026-09-08T14:30')
    fireEvent.click(screen.getByRole('button', { name: 'Clear due date' }))
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    expect(screen.getByLabelText('Due date time')).toHaveValue('')
  })
  it('retains invalid typed dates for validation instead of silently rolling into another month', () => {
    render(<Field initial="2026-02-28T09:00:00" />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Due date' }), {
      target: { value: '2026-02-30' },
    })
    expect(screen.getByRole('textbox', { name: 'Due date' })).toHaveValue('2026-02-30')
    expect(() => toTimestamp(screen.getByRole('status').textContent!, 'UTC')).toThrow()
  })
})
