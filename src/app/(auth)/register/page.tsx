'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Leaf, Eye, EyeOff, Loader2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const registerSchema = z.object({
  email: z.string().email('Bitte eine gültige E-Mail-Adresse eingeben'),
  password: z
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
    .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten'),
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterForm) {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Diese E-Mail-Adresse ist bereits registriert.')
        } else {
          setError('Registrierung fehlgeschlagen. Bitte versuche es erneut.')
        }
        return
      }

      if (authData.session) {
        window.location.href = '/dashboard'
        return
      }

      // Email confirmation required
      setSuccess(true)
    } catch {
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-sm shadow-sm">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <Leaf className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">Fast geschafft!</CardTitle>
            <CardDescription>Bitte überprüfe deine E-Mails</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground space-y-4">
          <p>
            Wir haben dir einen Bestätigungslink zugeschickt. Klicke darauf, um dein Konto zu aktivieren.
          </p>
          <p className="text-xs">Keine E-Mail erhalten? Prüfe deinen Spam-Ordner.</p>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary font-medium hover:underline">
            Zurück zur Anmeldung
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm shadow-sm">
      <CardHeader className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="bg-primary/10 p-3 rounded-full">
            <Leaf className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div>
          <CardTitle className="text-2xl">Eden</CardTitle>
          <CardDescription>Erstelle dein Konto</CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="du@beispiel.de"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Passwort</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                className="pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password ? (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Min. 8 Zeichen, ein Großbuchstabe und eine Zahl
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Konto erstellen
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm text-muted-foreground">
        Bereits registriert?&nbsp;
        <Link href="/login" className="text-primary font-medium hover:underline">
          Anmelden
        </Link>
      </CardFooter>
    </Card>
  )
}
