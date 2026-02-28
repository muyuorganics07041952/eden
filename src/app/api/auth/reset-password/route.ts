import { createClient } from '@/lib/supabase/server'
import { resetPasswordSchema } from '@/lib/validations/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Server-side Zod validation
    const result = resetPasswordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Ungueltige Eingaben.', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email } = result.data

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

    // BUG-9 fix: use consistent timing to prevent email enumeration via response time
    const minDelay = new Promise((resolve) => setTimeout(resolve, 200))

    const [{ error }] = await Promise.all([
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/auth/callback?type=recovery`,
      }),
      minDelay,
    ])

    if (error) {
      return NextResponse.json(
        { error: 'E-Mail konnte nicht gesendet werden. Bitte versuche es erneut.' },
        { status: 500 }
      )
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Link gesendet.',
    })
  } catch {
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten.' },
      { status: 500 }
    )
  }
}
