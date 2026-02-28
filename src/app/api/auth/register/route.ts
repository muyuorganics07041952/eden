import { createClient } from '@/lib/supabase/server'
import { registerSchema } from '@/lib/validations/auth'
import { NextResponse } from 'next/server'

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

    // BUG-3 fix: use server-side env var instead of spoofable Origin header
    // BUG-8 fix: validate env var is set before use
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      return NextResponse.json(
        { error: 'Server-Konfigurationsfehler.' },
        { status: 500 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
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
