import { describe, expect, it } from 'vitest'
import {
  conflictOn,
  offeredWindows,
  planRow,
  planSlots,
  rowMatchesLength,
  sampleTimes,
  sessionFor,
} from './schedule.plan'

describe('sessionFor', () => {
  it('calls anything starting before one o clock the morning', () => {
    expect(sessionFor('09:00')).toBe('morning')
    expect(sessionFor('12:00')).toBe('morning')
    expect(sessionFor('12:59:00')).toBe('morning')
  })

  it('calls one o clock and later the evening', () => {
    expect(sessionFor('13:00')).toBe('evening')
    expect(sessionFor('17:00:00')).toBe('evening')
  })
})

describe('planSlots', () => {
  it('cuts hours that divide evenly into appointments of that length', () => {
    const plan = planSlots('09:00', '15:00', 20)
    expect(plan.count).toBe(18)
    expect(plan.starts.slice(0, 3)).toEqual(['09:00', '09:20', '09:40'])
    expect(plan.starts.at(-1)).toBe('14:40')
    expect(plan.lastEnd).toBe('15:00')
    expect(plan.leftover).toBe(0)
  })

  it('counts only whole appointments and reports what is left', () => {
    const plan = planSlots('09:00', '14:30', 20)
    expect(plan.count).toBe(16)
    expect(plan.lastEnd).toBe('14:20')
    expect(plan.leftover).toBe(10)
  })

  it('finds none when the hours are shorter than one appointment', () => {
    expect(planSlots('09:00', '09:15', 20).count).toBe(0)
    expect(planSlots('10:00', '09:00', 20).count).toBe(0)
  })
})

describe('planRow', () => {
  it('keeps the patients typed when booking by queue', () => {
    expect(planRow('09:00', '14:00', null, 16)).toEqual({
      session: 'morning',
      startTime: '09:00',
      endTime: '14:00',
      capacity: 16,
      slotMinutes: null,
    })
  })

  it('gives one place per appointment and ends at the last whole one', () => {
    expect(planRow('17:00', '21:10', 20, 999)).toEqual({
      session: 'evening',
      startTime: '17:00',
      endTime: '21:00',
      capacity: 12,
      slotMinutes: 20,
    })
  })

  it('refuses hours that hold no appointment', () => {
    expect(planRow('09:00', '09:10', 20, 1)).toBeNull()
    expect(planRow('09:00', '09:00', null, 5)).toBeNull()
  })

  // The point of the whole rule: whatever the doctor types, the database
  // offers exactly the appointments the preview listed, one place each.
  it.each([
    ['09:00', '15:00', 20],
    ['09:00', '14:30', 20],
    ['16:00', '20:45', 15],
    ['10:00', '13:00', 45],
    ['18:00', '19:00', 60],
  ])('offers exactly the planned slots for %s-%s at %i minutes', (start, end, length) => {
    const row = planRow(start, end, length, 0)!
    const plan = planSlots(start, end, length)
    expect(offeredWindows(row)).toEqual(plan.starts.map((s) => ({ start: s, capacity: 1 })))
    expect(rowMatchesLength(row)).toBe(true)
  })
})

describe('offeredWindows', () => {
  it('drops windows that a short capacity leaves empty, as the database does', () => {
    // Fifteen twenty-minute windows over 9-14 with ten patients: five vanish.
    const shown = offeredWindows({
      startTime: '09:00',
      endTime: '14:00',
      capacity: 10,
      slotMinutes: 20,
    })
    expect(shown).toHaveLength(10)
  })

  it('shrinks every window when the length does not divide the hours', () => {
    const shown = offeredWindows({
      startTime: '09:00',
      endTime: '14:30',
      capacity: 17,
      slotMinutes: 20,
    })
    expect(shown).toHaveLength(17)
    expect(shown[1].start).toBe('09:19')
  })

  it('offers a queue day as one window holding everybody', () => {
    expect(
      offeredWindows({ startTime: '09:00', endTime: '14:00', capacity: 16, slotMinutes: null }),
    ).toEqual([{ start: '09:00', capacity: 16 }])
  })
})

describe('rowMatchesLength', () => {
  it('flags rows whose capacity and length disagree', () => {
    expect(
      rowMatchesLength({ startTime: '09:00', endTime: '14:00', capacity: 10, slotMinutes: 20 }),
    ).toBe(false)
    expect(
      rowMatchesLength({ startTime: '09:00', endTime: '14:30', capacity: 16, slotMinutes: 20 }),
    ).toBe(false)
    expect(
      rowMatchesLength({ startTime: '09:00', endTime: '14:00', capacity: 15, slotMinutes: 20 }),
    ).toBe(true)
  })
})

describe('conflictOn', () => {
  const week = [
    { id: 1, weekday: 0, session: 'morning', startTime: '09:00:00', endTime: '14:00:00' },
    { id: 2, weekday: 1, session: 'evening', startTime: '17:00:00', endTime: '21:00:00' },
  ]

  it('refuses a second morning on the same day', () => {
    expect(
      conflictOn(week, 0, { session: 'morning', startTime: '10:00', endTime: '11:00' }),
    ).toEqual({ kind: 'sameSession', withId: 1 })
  })

  it('refuses an evening that runs into the morning', () => {
    expect(
      conflictOn(week, 0, { session: 'evening', startTime: '13:00', endTime: '18:00' }),
    ).toEqual({ kind: 'overlap', withId: 1 })
  })

  it('lets the other half of the day in, and a row be checked against all but itself', () => {
    expect(
      conflictOn(week, 0, { session: 'evening', startTime: '17:00', endTime: '21:00' }),
    ).toBeNull()
    expect(
      conflictOn(week, 0, { session: 'morning', startTime: '08:00', endTime: '12:00' }, 1),
    ).toBeNull()
  })
})

describe('sampleTimes', () => {
  it('lists a few times whole and a long day by its first three and last', () => {
    expect(sampleTimes(['09:00', '09:30'])).toEqual({ head: ['09:00', '09:30'], last: null })
    const many = planSlots('09:00', '15:00', 20).starts
    expect(sampleTimes(many)).toEqual({ head: ['09:00', '09:20', '09:40'], last: '14:40' })
  })
})
