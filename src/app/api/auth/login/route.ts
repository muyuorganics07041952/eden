import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validations/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Server-side Zod validation
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Ungueltige Eingaben.', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email, password } = result.data
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: 'E-Mail oder Passwort ist falsch.' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: { id: data.user.id, email: data.user.email },
    })
  } catch {
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten.' },
      { status: 500 }
    )
  }
}
