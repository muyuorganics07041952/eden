import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

async function verifyAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  if (ADMIN_EMAIL && user.email !== ADMIN_EMAIL) return false
  return true
}

// GET /api/admin/social?status=pending
export async function GET(request: Request) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? 'pending'
  const platform = searchParams.get('platform')

  const supabase = createAdminClient()

  let query = supabase
    .from('social_queue')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50)

  if (platform) {
    query = query.eq('platform', platform)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: data })
}

// PATCH /api/admin/social  { id, action: 'approve' | 'reject' }
export async function PATCH(request: Request) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, action, edited_content } = body

  if (!id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const update: Record<string, unknown> = {
    status: action === 'approve' ? 'approved' : 'rejected',
    approved_at: action === 'approve' ? new Date().toISOString() : null,
  }

  if (edited_content) {
    update.generated_content = edited_content
  }

  const { data, error } = await supabase
    .from('social_queue')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ item: data })
}
