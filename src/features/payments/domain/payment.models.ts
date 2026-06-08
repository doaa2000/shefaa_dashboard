export interface Payment {
  id: number
  bookingId: number
  bookedDate: string
  patientName: string | null
  amount: number
  method: string | null
  status: string | null
  createdAt: string | null
}

export interface PaymentListResult {
  items: Payment[]
  total: number
  totalAmount: number
}
