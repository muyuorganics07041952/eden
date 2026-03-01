export type CareFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'three_months'
  | 'six_months'
  | 'yearly'
  | 'custom'

export type CareTask = {
  id: string
  plant_id: string
  user_id: string
  name: string
  frequency: CareFrequency
  interval_days: number
  next_due_date: string // ISO date YYYY-MM-DD
  notes: string | null
  created_at: string
}

export type TodayCareTask = CareTask & {
  plant_name: string
}

/**
 * Maps fixed frequency values to their interval in days.
 * Used server-side to derive interval_days for non-custom frequencies.
 */
export const FREQUENCY_INTERVAL_MAP: Record<Exclude<CareFrequency, 'custom'>, number> = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  three_months: 90,
  six_months: 180,
  yearly: 365,
}

/** German labels for frequency values */
export const FREQUENCY_LABELS: Record<CareFrequency, string> = {
  daily: 'Täglich',
  weekly: 'Wöchentlich',
  biweekly: 'Alle 2 Wochen',
  monthly: 'Monatlich',
  three_months: 'Alle 3 Monate',
  six_months: 'Alle 6 Monate',
  yearly: 'Jährlich',
  custom: 'Benutzerdefiniert',
}

/** All frequency options for select menus */
export const FREQUENCY_OPTIONS: { value: CareFrequency; label: string }[] = [
  { value: 'daily', label: 'Täglich' },
  { value: 'weekly', label: 'Wöchentlich' },
  { value: 'biweekly', label: 'Alle 2 Wochen' },
  { value: 'monthly', label: 'Monatlich' },
  { value: 'three_months', label: 'Alle 3 Monate' },
  { value: 'six_months', label: 'Alle 6 Monate' },
  { value: 'yearly', label: 'Jährlich' },
  { value: 'custom', label: 'Benutzerdefiniert' },
]
