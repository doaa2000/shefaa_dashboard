/**
 * Database type definitions.
 *
 * In a connected project these are regenerated with:
 *   npm run db:types   (supabase gen types typescript --linked)
 *
 * They are committed so the codebase type-checks without a live DB connection.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
export type AppointmentType = 'in_person' | 'video' | 'phone'
export type GenderType = 'male' | 'female' | 'other' | 'unspecified'
export type ConsultationStatus = 'draft' | 'finalized'
export type PrescriptionStatus = 'active' | 'completed' | 'cancelled'
export type NotificationType = 'appointment' | 'system' | 'message' | 'reminder'
export type WeekdayType = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          avatar_url: string | null
          specialty: string | null
          bio: string | null
          license_number: string | null
          clinic_name: string | null
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          specialty?: string | null
          bio?: string | null
          license_number?: string | null
          clinic_name?: string | null
          timezone?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      patients: {
        Row: {
          id: string
          doctor_id: string
          full_name: string
          email: string | null
          phone: string | null
          date_of_birth: string | null
          gender: GenderType
          blood_type: string | null
          address: string | null
          medical_history: string | null
          allergies: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          full_name: string
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          gender?: GenderType
          blood_type?: string | null
          address?: string | null
          medical_history?: string | null
          allergies?: string[]
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['patients']['Insert']>
        Relationships: []
      }
      doctor_schedules: {
        Row: {
          id: string
          doctor_id: string
          weekday: WeekdayType
          start_time: string
          end_time: string
          slot_duration_minutes: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          weekday: WeekdayType
          start_time: string
          end_time: string
          slot_duration_minutes?: number
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['doctor_schedules']['Insert']>
        Relationships: []
      }
      appointments: {
        Row: {
          id: string
          doctor_id: string
          patient_id: string
          scheduled_at: string
          duration_minutes: number
          type: AppointmentType
          status: AppointmentStatus
          reason: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          patient_id: string
          scheduled_at: string
          duration_minutes?: number
          type?: AppointmentType
          status?: AppointmentStatus
          reason?: string | null
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'appointments_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'patients'
            referencedColumns: ['id']
          },
        ]
      }
      consultations: {
        Row: {
          id: string
          doctor_id: string
          patient_id: string
          appointment_id: string | null
          chief_complaint: string | null
          diagnosis: string | null
          symptoms: string[]
          clinical_notes: string | null
          vitals: Json
          status: ConsultationStatus
          consulted_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          patient_id: string
          appointment_id?: string | null
          chief_complaint?: string | null
          diagnosis?: string | null
          symptoms?: string[]
          clinical_notes?: string | null
          vitals?: Json
          status?: ConsultationStatus
          consulted_at?: string
        }
        Update: Partial<Database['public']['Tables']['consultations']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'consultations_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'patients'
            referencedColumns: ['id']
          },
        ]
      }
      prescriptions: {
        Row: {
          id: string
          doctor_id: string
          patient_id: string
          consultation_id: string | null
          status: PrescriptionStatus
          notes: string | null
          issued_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          patient_id: string
          consultation_id?: string | null
          status?: PrescriptionStatus
          notes?: string | null
          issued_at?: string
        }
        Update: Partial<Database['public']['Tables']['prescriptions']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'prescriptions_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'patients'
            referencedColumns: ['id']
          },
        ]
      }
      prescription_items: {
        Row: {
          id: string
          prescription_id: string
          medication_name: string
          dosage: string | null
          frequency: string | null
          duration: string | null
          instructions: string | null
          created_at: string
        }
        Insert: {
          id?: string
          prescription_id: string
          medication_name: string
          dosage?: string | null
          frequency?: string | null
          duration?: string | null
          instructions?: string | null
        }
        Update: Partial<Database['public']['Tables']['prescription_items']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'prescription_items_prescription_id_fkey'
            columns: ['prescription_id']
            isOneToOne: false
            referencedRelation: 'prescriptions'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          doctor_id: string
          type: NotificationType
          title: string
          body: string | null
          is_read: boolean
          entity_type: string | null
          entity_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          type?: NotificationType
          title: string
          body?: string | null
          is_read?: boolean
          entity_type?: string | null
          entity_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: {
      dashboard_summary: {
        Args: Record<string, never>
        Returns: Json
      }
      appointments_trend: {
        Args: { days?: number }
        Returns: { day: string; total: number }[]
      }
    }
    Enums: {
      appointment_status: AppointmentStatus
      appointment_type: AppointmentType
      gender_type: GenderType
      consultation_status: ConsultationStatus
      prescription_status: PrescriptionStatus
      notification_type: NotificationType
      weekday_type: WeekdayType
    }
  }
}

/** Convenience row aliases. */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
