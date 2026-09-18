export interface DashboardSummary {
  totalPatients: number
  /** Of those, the ones who had never been here before this month. */
  newPatientsThisMonth: number
  appointmentsToday: number
  appointmentsUpcoming: number
  unreadNotifications: number
  revenueThisMonth: number
}
