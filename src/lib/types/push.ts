import { z } from 'zod'

// --- Database type ---

export interface PushSubscriptionData {
  id: string
  user_id: string
  endpoint: string
  p256dh_key: string
  auth_key: string
  timezone: string
  reminder_hour: number
  enabled: boolean
  created_at: string
}

// --- Zod schemas for API validation ---

function isValidIANATimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz })
    return true
  } catch {
    return false
  }
}

export const subscribeSchema = z.object({
  endpoint: z.string().url('Endpoint muss eine gueltige URL sein'),
  p256dh: z.string().min(1, 'p256dh ist erforderlich'),
  auth: z.string().min(1, 'auth ist erforderlich'),
  timezone: z.string().min(1, 'Zeitzone ist erforderlich').refine(
    isValidIANATimezone,
    'Zeitzone muss eine gueltige IANA-Zeitzone sein (z.B. Europe/Berlin)'
  ),
  reminderHour: z.number().int().min(0).max(23, 'Stunde muss zwischen 0 und 23 liegen'),
})

export const unsubscribeSchema = z.object({
  endpoint: z.string().url('Endpoint muss eine gueltige URL sein'),
})

export const settingsSchema = z.object({
  reminderHour: z.number().int().min(0).max(23, 'Stunde muss zwischen 0 und 23 liegen'),
})
