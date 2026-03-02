import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { FeedResponse } from '@/lib/types/feed'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // Fetch personalized articles (user_id = current user), latest 6
  const { data: personalized, error: persError } = await supabase
    .from('feed_articles')
    .select('id, title, summary, category, reading_time, created_at, user_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(6)

  if (persError) {
    console.error('Error fetching personalized feed articles:', persError)
    return NextResponse.json({ error: 'Fehler beim Laden des Feeds.' }, { status: 500 })
  }

  // Fetch general articles (user_id IS NULL), latest 9
  const { data: general, error: genError } = await supabase
    .from('feed_articles')
    .select('id, title, summary, category, reading_time, created_at, user_id')
    .is('user_id', null)
    .order('created_at', { ascending: false })
    .limit(9)

  if (genError) {
    console.error('Error fetching general feed articles:', genError)
    return NextResponse.json({ error: 'Fehler beim Laden des Feeds.' }, { status: 500 })
  }

  const response: FeedResponse = {
    personalized: personalized ?? [],
    general: general ?? [],
  }

  return NextResponse.json(response)
}
