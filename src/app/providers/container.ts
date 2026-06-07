import { supabase } from '@/core/http/supabase.client'

import { SupabaseAuthRepository } from '@/features/auth/infrastructure/supabase-auth.repository'
import { AuthService } from '@/features/auth/application/auth.service'

import { SupabasePatientRepository } from '@/features/patients/infrastructure/supabase-patient.repository'
import { PatientService } from '@/features/patients/application/patient.service'

import { SupabaseAppointmentRepository } from '@/features/appointments/infrastructure/supabase-appointment.repository'
import { AppointmentService } from '@/features/appointments/application/appointment.service'

import { SupabaseConsultationRepository } from '@/features/consultations/infrastructure/supabase-consultation.repository'
import { ConsultationService } from '@/features/consultations/application/consultation.service'

import { SupabasePrescriptionRepository } from '@/features/prescriptions/infrastructure/supabase-prescription.repository'
import { PrescriptionService } from '@/features/prescriptions/application/prescription.service'

import { SupabaseNotificationRepository } from '@/features/notifications/infrastructure/supabase-notification.repository'
import { NotificationService } from '@/features/notifications/application/notification.service'

import { SupabaseDashboardRepository } from '@/features/dashboard/infrastructure/supabase-dashboard.repository'
import { DashboardService } from '@/features/dashboard/application/dashboard.service'

import { SupabaseReportRepository } from '@/features/reports/infrastructure/supabase-report.repository'
import { ReportService } from '@/features/reports/application/report.service'

import { SupabaseScheduleRepository } from '@/features/settings/infrastructure/supabase-schedule.repository'
import { ScheduleService } from '@/features/settings/application/schedule.service'

/**
 * Composition root.
 *
 * This is the ONE place that knows about concrete (Supabase) implementations.
 * Repositories are constructed here and injected into services; the rest of the
 * app depends only on the service instances exposed below (DIP). Swapping the
 * data source (e.g. for tests) means changing only this file.
 */
function createContainer() {
  const authService = new AuthService(new SupabaseAuthRepository(supabase))
  const patientService = new PatientService(new SupabasePatientRepository(supabase))
  const appointmentService = new AppointmentService(new SupabaseAppointmentRepository(supabase))
  const consultationService = new ConsultationService(new SupabaseConsultationRepository(supabase))
  const prescriptionService = new PrescriptionService(new SupabasePrescriptionRepository(supabase))
  const notificationService = new NotificationService(new SupabaseNotificationRepository(supabase))
  const dashboardService = new DashboardService(new SupabaseDashboardRepository(supabase))
  const reportService = new ReportService(new SupabaseReportRepository(supabase))
  const scheduleService = new ScheduleService(new SupabaseScheduleRepository(supabase))

  return {
    authService,
    patientService,
    appointmentService,
    consultationService,
    prescriptionService,
    notificationService,
    dashboardService,
    reportService,
    scheduleService,
  } as const
}

export type Container = ReturnType<typeof createContainer>

export const container: Container = createContainer()
