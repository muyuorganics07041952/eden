import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendTelegramMessage, newUserMessage } from '@/lib/telegram'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle error responses from Supabase (e.g., expired recovery link)
  if (errorParam) {
    const message = encodeURIComponent(errorDescription || 'Ein Fehler ist aufgetreten.')
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/reset-password?error=${message}`)
    }
    return NextResponse.redirect(`${origin}/login?error=${message}`)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      const message = encodeURIComponent('Der Link ist abgelaufen oder ungueltig. Bitte versuche es erneut.')
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password?error=${message}`)
      }
      return NextResponse.redirect(`${origin}/login?error=${message}`)
    }

    // Notify on email confirmation (not password recovery)
    if (type !== 'recovery' && data.user?.email) {
      sendTelegramMessage(newUserMessage(data.user.email))
    }
  }

  // For password recovery, redirect to update-password page
  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/update-password`)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
