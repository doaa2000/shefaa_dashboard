import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/core/config/env'
import type { Database } from '@/core/types/database.types'

/**
 * Single, strongly-typed Supabase client instance for the whole app.
 * The generated `Database` type makes every query/result fully typed.
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  env.supabaseUrl,
  env.supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  },
)

export type AppSupabaseClient = SupabaseClient<Database>
