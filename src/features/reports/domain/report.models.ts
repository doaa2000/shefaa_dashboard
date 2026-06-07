export interface TrendPoint {
  day: string
  total: number
}

export interface AppointmentsTrend {
  points: TrendPoint[]
  totalInPeriod: number
}
