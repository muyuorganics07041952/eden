import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SocialQueueClient } from '@/components/admin/social-queue-client'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

export default async function SocialAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (ADMIN_EMAIL && user.email !== ADMIN_EMAIL) redirect('/dashboard')

  const admin = createAdminClient()
  const [pendingRes, approvedRes, historyRes] = await Promise.all([
    admin.from('social_queue').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(50),
    admin.from('social_queue').select('*').eq('status', 'approved').order('approved_at', { ascending: false }).limit(20),
    admin.from('social_history').select('*').order('posted_at', { ascending: false }).limit(20),
  ])
  const pending = pendingRes.data
  const approved = approvedRes.data
  const history = historyRes.data

  return (
    <SocialQueueClient
      initialPending={pending ?? []}
      initialApproved={approved ?? []}
      initialHistory={history ?? []}
    />
  )
}
