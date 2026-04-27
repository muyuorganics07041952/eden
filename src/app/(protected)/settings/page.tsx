import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Settings, Send } from "lucide-react"
import { NotificationSettingsCard } from "@/components/notifications/notification-settings-card"
import { LocationSettingsCard } from "@/components/settings/location-settings-card"
import { ProfileSettingsCard } from "@/components/settings/profile-settings-card"
import { InstallGuideCard } from "@/components/settings/install-guide-card"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

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
      .select('city_name, latitude, longitude, display_name')
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

      <ProfileSettingsCard initialDisplayName={userSettings?.display_name ?? null} />

      <NotificationSettingsCard initialReminderHour={initialReminderHour} />

      <LocationSettingsCard
        initialCityName={userSettings?.city_name ?? null}
        initialLatitude={userSettings?.latitude ?? null}
        initialLongitude={userSettings?.longitude ?? null}
      />

      <InstallGuideCard />

      <Link href="/admin/social">
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <CardContent className="pt-4 flex items-center gap-3">
            <Send className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium text-sm">Social Media Queue</div>
              <div className="text-xs text-muted-foreground">Posts genehmigen und verwalten</div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
