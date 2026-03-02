import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Artikel nicht gefunden.' }, { status: 404 })
  }

  // RLS handles authorization: user can only read general OR their own personalized articles
  const { data: article, error: articleError } = await supabase
    .from('feed_articles')
    .select('*')
    .eq('id', id)
    .single()

  if (articleError || !article) {
    return NextResponse.json({ error: 'Artikel nicht gefunden.' }, { status: 404 })
  }

  return NextResponse.json(article)
}
