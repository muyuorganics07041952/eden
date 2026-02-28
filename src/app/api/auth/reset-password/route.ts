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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/callback?type=recovery`,
    })

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
