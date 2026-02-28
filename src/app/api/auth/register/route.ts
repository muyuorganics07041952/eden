import { createClient } from '@/lib/supabase/server'
import { registerSchema } from '@/lib/validations/auth'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Server-side Zod validation
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Ungueltige Eingaben.', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email, password } = result.data

    // Derive origin from request headers for the email redirect URL
    const headersList = await headers()
    const origin = headersList.get('origin') || headersList.get('referer')?.replace(/\/[^/]*$/, '') || ''

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Diese E-Mail-Adresse ist bereits registriert.' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: 'Registrierung fehlgeschlagen. Bitte versuche es erneut.' },
        { status: 400 }
      )
    }

    // If a session is returned, user is immediately logged in (email confirmation disabled)
    if (data.session) {
      return NextResponse.json({
        user: { id: data.user!.id, email: data.user!.email },
        session: true,
      })
    }

    // Email confirmation required
    return NextResponse.json({
      user: null,
      session: false,
      message: 'Bitte ueberprüfe deine E-Mails, um dein Konto zu aktivieren.',
    })
  } catch {
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten.' },
      { status: 500 }
    )
  }
}
