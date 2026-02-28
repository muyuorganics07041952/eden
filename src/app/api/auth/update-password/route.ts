import { createClient } from '@/lib/supabase/server'
import { updatePasswordSchema } from '@/lib/validations/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Server-side Zod validation
    const result = updatePasswordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Ungueltige Eingaben.', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { password } = result.data
    const supabase = await createClient()

    // Verify user is authenticated (recovery session must exist from callback)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert. Der Link ist moeglicherweise abgelaufen.' },
        { status: 401 }
      )
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      if (error.message.includes('expired') || error.message.includes('invalid')) {
        return NextResponse.json(
          { error: 'Der Link ist abgelaufen. Bitte fordere einen neuen Link an.' },
          { status: 401 }
        )
      }
      return NextResponse.json(
        { error: 'Passwort konnte nicht aktualisiert werden. Bitte versuche es erneut.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Passwort erfolgreich aktualisiert.',
    })
  } catch {
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten.' },
      { status: 500 }
    )
  }
}
