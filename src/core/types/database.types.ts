/**
 * Database type definitions — mapped to the existing Shefaa production schema
 * plus the additive dashboard tables (consultations, prescriptions,
 * prescription_items, notifications).
 *
 * Regenerate from a linked project with:
 *   npm run db:types
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      Doctors: {
        Row: {
          id: number
          name: string
          specialization: string | null
          clinic_id: number | null
          specialty_id: number | null
          image: string | null
          title: string | null
          rating: number | null
          consultation_fee: number | null
          waiting_time: number | null
          location: string | null
          user_id: string | null
          email: string | null
          bio: string | null
          license_number: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          specialization?: string | null
          clinic_id?: number | null
          specialty_id?: number | null
          image?: string | null
          title?: string | null
          rating?: number | null
          consultation_fee?: number | null
          waiting_time?: number | null
          location?: string | null
          user_id?: string | null
          email?: string | null
          bio?: string | null
          license_number?: string | null
          phone?: string | null
        }
        Update: Partial<Database['public']['Tables']['Doctors']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'Doctors_specialty_id_fkey'
            columns: ['specialty_id']
            isOneToOne: false
            referencedRelation: 'specialties'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'Doctors_clinic_id_fkey'
            columns: ['clinic_id']
            isOneToOne: false
            referencedRelation: 'Clinics'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          name: string | null
          phone: string | null
          gender: string | null
          birth_date: string | null
        }
        Insert: {
          id: string
          name?: string | null
          phone?: string | null
          gender?: string | null
          birth_date?: string | null
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      bookings: {
        Row: {
          id: number
          patient_id: string
          doctor_id: number
          payment_id: number | null
          booked_date: string
          start_time: string
          end_time: string
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          patient_id: string
          doctor_id: number
          payment_id?: number | null
          booked_date: string
          start_time: string
          end_time: string
          status?: string | null
        }
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'bookings_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bookings_payment_id_fkey'
            columns: ['payment_id']
            isOneToOne: false
            referencedRelation: 'payments'
            referencedColumns: ['id']
          },
        ]
      }
      doctor_availability: {
        Row: {
          id: number
          doctor_id: number | null
          date: string
          start_time: string | null
          end_time: string | null
          session: string | null
          is_active: boolean | null
        }
        Insert: {
          id?: number
          doctor_id?: number | null
          date: string
          start_time?: string | null
          end_time?: string | null
          session?: string | null
          is_active?: boolean | null
        }
        Update: Partial<Database['public']['Tables']['doctor_availability']['Insert']>
        Relationships: []
      }
      doctor_schedule: {
        Row: {
          id: number
          doctor_id: number
          weekday: number
          session: string
          start_time: string
          end_time: string
          capacity: number
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          doctor_id: number
          weekday: number
          session: string
          start_time: string
          end_time: string
          capacity: number
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['doctor_schedule']['Insert']>
        Relationships: []
      }
      doctor_schedule_exceptions: {
        Row: {
          id: number
          doctor_id: number
          date: string
          session: string | null
          is_closed: boolean
          start_time: string | null
          end_time: string | null
          capacity: number | null
          reason: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          doctor_id: number
          date: string
          session?: string | null
          is_closed?: boolean
          start_time?: string | null
          end_time?: string | null
          capacity?: number | null
          reason?: string | null
        }
        Update: Partial<Database['public']['Tables']['doctor_schedule_exceptions']['Insert']>
        Relationships: []
      }
      payments: {
        Row: {
          id: number
          patient_id: string
          amount: number
          payment_method: string | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          patient_id: string
          amount: number
          payment_method?: string | null
          status?: string | null
        }
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
        Relationships: []
      }
      specialties: {
        Row: { id: number; name: string; icon: string | null }
        Insert: { id?: number; name: string; icon?: string | null }
        Update: Partial<Database['public']['Tables']['specialties']['Insert']>
        Relationships: []
      }
      Clinics: {
        Row: { id: number; name: string; address: string | null; city_id: number | null }
        Insert: { id?: number; name: string; address?: string | null; city_id?: number | null }
        Update: Partial<Database['public']['Tables']['Clinics']['Insert']>
        Relationships: []
      }
      Cities: {
        Row: { id: number; name: string; governorate_id: number | null }
        Insert: { id?: number; name: string; governorate_id?: number | null }
        Update: Partial<Database['public']['Tables']['Cities']['Insert']>
        Relationships: []
      }
      Governorates: {
        Row: { id: number; name: string; country_id: number | null }
        Insert: { id?: number; name: string; country_id?: number | null }
        Update: Partial<Database['public']['Tables']['Governorates']['Insert']>
        Relationships: []
      }
      consultations: {
        Row: {
          id: string
          doctor_id: number
          patient_id: string
          booking_id: number | null
          chief_complaint: string | null
          diagnosis: string | null
          symptoms: string[]
          clinical_notes: string | null
          vitals: Json
          status: string
          consulted_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          doctor_id: number
          patient_id: string
          booking_id?: number | null
          chief_complaint?: string | null
          diagnosis?: string | null
          symptoms?: string[]
          clinical_notes?: string | null
          vitals?: Json
          status?: string
          consulted_at?: string
        }
        Update: Partial<Database['public']['Tables']['consultations']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'consultations_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      prescriptions: {
        Row: {
          id: string
          doctor_id: number
          patient_id: string
          consultation_id: string | null
          status: string
          notes: string | null
          issued_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          doctor_id: number
          patient_id: string
          consultation_id?: string | null
          status?: string
          notes?: string | null
          issued_at?: string
        }
        Update: Partial<Database['public']['Tables']['prescriptions']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'prescriptions_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'profiles'
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
          doctor_id: number
          type: string
          title: string
          body: string | null
          is_read: boolean
          entity_type: string | null
          entity_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          doctor_id: number
          type?: string
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
      current_doctor_id: { Args: Record<string, never>; Returns: number }
      dashboard_summary: { Args: Record<string, never>; Returns: Json }
      bookings_trend: { Args: { days?: number }; Returns: { day: string; total: number }[] }
      doctor_patients: {
        Args: { search?: string }
        Returns: Database['public']['Tables']['profiles']['Row'][]
      }
    }
    Enums: Record<never, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
