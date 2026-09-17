import type { AppSupabaseClient } from '@/core/http/supabase.client'
import { type Result, ok, err } from '@/core/result'
import { type AppError, normalizeError } from '@/core/errors'
import type { IPushRepository } from '../domain/push.repository'

export class SupabasePushRepository implements IPushRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async register(token: string): Promise<Result<void, AppError>> {
    try {
      const { error } = await this.client.rpc('register_device_token', {
        p_token: token,
        p_platform: 'web',
      })
      if (error) return err(normalizeError(error))
      return ok(undefined)
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async unregister(token: string): Promise<Result<void, AppError>> {
    try {
      const { error } = await this.client.rpc('unregister_device_token', {
        p_token: token,
      })
      if (error) return err(normalizeError(error))
      return ok(undefined)
    } catch (e) {
      return err(normalizeError(e))
    }
  }
}
