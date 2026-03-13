import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: plantId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // Verify plant belongs to user
  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .select('id')
    .eq('id', plantId)
    .eq('user_id', user.id)
    .single()

  if (plantError || !plant) {
    return NextResponse.json({ error: 'Pflanze nicht gefunden.' }, { status: 404 })
  }

  // Parse pagination params
  const searchParams = request.nextUrl.searchParams
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '10', 10) || 10, 1), 50)
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10) || 0, 0)

  const { data: completions, error, count } = await supabase
    .from('care_task_completions')
    .select('*', { count: 'exact' })
    .eq('plant_id', plantId)
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error loading completion history:', error)
    return NextResponse.json({ error: 'Fehler beim Laden des Verlaufs.' }, { status: 500 })
  }

  return NextResponse.json({
    completions: completions ?? [],
    total: count ?? 0,
    limit,
    offset,
  })
}
