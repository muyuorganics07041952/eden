import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SocialQueueClient } from '@/components/admin/social-queue-client'

export default async function SocialAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <SocialQueueClient initialPending={[]} initialApproved={[]} initialHistory={[]} />
}
