import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Settings } from "lucide-react"
import { NotificationSettingsCard } from "@/components/notifications/notification-settings-card"
import { LocationSettingsCard } from "@/components/settings/location-settings-card"
import { InstallGuideCard } from "@/components/settings/install-guide-card"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Load the most recent subscription to get the saved reminder hour
  const [{ data: subscription }, { data: userSettings }] = await Promise.all([
    supabase
      .from('push_subscriptions')
      .select('reminder_hour')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('user_settings')
      .select('city_name, latitude, longitude')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const initialReminderHour = subscription?.reminder_hour ?? 8

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Einstellungen
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Verwalte deine App-Einstellungen und Benachrichtigungen.
        </p>
      </div>

      <NotificationSettingsCard initialReminderHour={initialReminderHour} />

      <LocationSettingsCard
        initialCityName={userSettings?.city_name ?? null}
        initialLatitude={userSettings?.latitude ?? null}
        initialLongitude={userSettings?.longitude ?? null}
      />

      <InstallGuideCard />
    </div>
  )
}
