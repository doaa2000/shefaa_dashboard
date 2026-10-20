import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import type { Appointment, QueueEntry } from '../domain/appointment.models'
import { orderPresent, useQueue } from './useQueue'
import { useAppointmentStore } from '../store/appointment.store'

// The store reaches for the Supabase client through the container, and for
// the signed-in doctor through the auth store. Neither has any say in the
// order of a queue, so both are stood in for. vi.mock is lifted above the
// imports, so these are in place before the store is loaded.
vi.mock('@/app/providers/container', () => ({ container: { appointmentService: {} } }))
vi.mock('@/features/auth/store/auth.store', () => ({ useAuthStore: () => ({ doctorId: 1 }) }))

function booking(id: number, patch: Partial<Appointment> = {}): Appointment {
  return {
    id,
    patientId: null,
    patientName: `patient ${id}`,
    doctorId: 1,
    origin: 'clinic',
    walkInName: null,
    walkInPhone: null,
    paymentId: null,
    bookedDate: '2026-10-19',
    session: 'morning',
    startTime: '09:00:00',
    endTime: '12:00:00',
    status: 'confirmed',
    createdAt: null,
    wholeSession: true,
    arrivedAt: null,
    ...patch,
  }
}

/** Present entries numbered in the order given, which stands for booking order. */
function present(...rows: Appointment[]): QueueEntry[] {
  return rows.map((a, i) => ({
    ...a,
    position: i + 1,
    isDone: false,
    isWaiting: true,
    isPresent: true,
  }))
}

const at = (hhmm: string) => `2026-10-19T${hhmm}:00.000Z`
const ids = (entries: QueueEntry[]) => entries.map((e) => e.id)

describe('orderPresent', () => {
  it('runs a whole session by who arrived first', () => {
    const rows = present(
      booking(1, { arrivedAt: at('09:40') }),
      booking(2, { arrivedAt: at('09:05') }),
      booking(3, { arrivedAt: at('09:10') }),
    )
    expect(ids(orderPresent(rows))).toEqual([2, 3, 1])
  })

  it('compares arrival as instants, not as text', () => {
    const rows = present(
      booking(1, { arrivedAt: '2026-10-19T09:30:00+00:00' }),
      booking(2, { arrivedAt: '2026-10-19T11:10:00+02:00' }),
    )
    expect(ids(orderPresent(rows))).toEqual([2, 1])
  })

  it('runs appointments by their time, whoever came in first', () => {
    const slot = (id: number, start: string, arrived: string) =>
      booking(id, {
        wholeSession: false,
        startTime: `${start}:00`,
        endTime: `${start}:20`,
        arrivedAt: at(arrived),
      })
    const rows = present(slot(1, '09:00', '09:50'), slot(2, '09:20', '09:05'), slot(3, '09:40', '09:10'))
    expect(ids(orderPresent(rows))).toEqual([1, 2, 3])
  })

  it('keeps a morning taken whole ahead of an evening cut into appointments', () => {
    const rows = present(
      booking(1, { arrivedAt: at('10:00') }),
      booking(2, { arrivedAt: at('09:00') }),
      booking(3, {
        session: 'evening',
        wholeSession: false,
        startTime: '18:00:00',
        endTime: '18:20:00',
        arrivedAt: at('08:00'),
      }),
    )
    expect(ids(orderPresent(rows))).toEqual([2, 1, 3])
  })

  it('leaves the turn with whoever already has it', () => {
    const rows = present(
      booking(1, { arrivedAt: at('09:00') }),
      booking(2, { arrivedAt: at('09:05') }),
      booking(3, { arrivedAt: at('09:10') }),
    )
    expect(ids(orderPresent(rows, 3))).toEqual([3, 1, 2])
  })

  it('ignores a pin on somebody no longer present', () => {
    const rows = present(booking(1, { arrivedAt: at('09:00') }), booking(2, { arrivedAt: at('09:05') }))
    expect(ids(orderPresent(rows, 9))).toEqual([1, 2])
  })
})

describe('useQueue', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** Sets the day the store holds, the way a tap or a reload would. */
  async function day(rows: Appointment[]): Promise<void> {
    useAppointmentStore().day = rows
    await nextTick()
  }

  it('runs a whole session by arrival: a late first booking waits behind those in the room', async () => {
    const q = useQueue()
    const [ahmed, sara, mohamed] = [booking(1), booking(2), booking(3)]
    await day([ahmed, sara, mohamed])
    await day([ahmed, { ...sara, arrivedAt: at('09:00') }, mohamed])
    await day([ahmed, { ...sara, arrivedAt: at('09:00') }, { ...mohamed, arrivedAt: at('09:05') }])

    expect(q.queue.value.current?.id).toBe(2)
    expect(q.queue.value.next?.id).toBe(3)
    expect(q.queue.value.notArrived).toBe(1)

    await day([
      { ...ahmed, arrivedAt: at('09:30') },
      { ...sara, arrivedAt: at('09:00') },
      { ...mohamed, arrivedAt: at('09:05') },
    ])
    expect(ids(q.queue.value.inLine)).toEqual([2, 3, 1])
  })

  it('keeps the turn when an earlier appointment arrives late', async () => {
    const q = useQueue()
    const slot = (id: number, start: string) =>
      booking(id, { wholeSession: false, startTime: `${start}:00`, endTime: `${start}:20` })
    const [first, second, third] = [slot(1, '09:00'), slot(2, '09:20'), slot(3, '09:40')]

    await day([first, { ...second, arrivedAt: at('09:15') }, third])
    expect(q.queue.value.current?.id).toBe(2)

    // The 09:00 appointment walks in after the 09:20 one was called: next,
    // not current.
    await day([{ ...first, arrivedAt: at('09:25') }, { ...second, arrivedAt: at('09:15') }, third])
    expect(q.queue.value.current?.id).toBe(2)
    expect(q.queue.value.next?.id).toBe(1)

    // Seen: the turn moves on, by appointment time.
    await day([
      { ...first, arrivedAt: at('09:25') },
      { ...second, arrivedAt: at('09:15'), status: 'completed' },
      { ...third, arrivedAt: at('09:20') },
    ])
    expect(q.queue.value.current?.id).toBe(1)
    expect(q.queue.value.next?.id).toBe(3)
  })

  it('gives the turn back when asked to', async () => {
    const q = useQueue()
    const rows = [booking(1, { arrivedAt: at('09:00') }), booking(2, { arrivedAt: at('09:05') })]
    await day(rows)
    expect(q.queue.value.current?.id).toBe(1)

    await day([{ ...rows[0], status: 'completed' }, rows[1]])
    expect(q.queue.value.current?.id).toBe(2)

    // Undoing "seen": they come back, and the turn with them.
    await day(rows)
    expect(q.queue.value.current?.id).toBe(2)
    q.pin(1)
    await nextTick()
    expect(q.queue.value.current?.id).toBe(1)
  })
})
