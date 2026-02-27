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

const loginSchema = z.object({
  email: z.string().email('Bitte eine gültige E-Mail-Adresse eingeben'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        setError('E-Mail oder Passwort ist falsch.')
        return
      }

      if (authData.session) {
        window.location.href = '/dashboard'
      }
    } catch {
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.')
    } finally {
      setIsLoading(false)
    }
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
          <CardDescription>Willkommen zurück</CardDescription>
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Passwort</Label>
              <Link
                href="/reset-password"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Vergessen?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
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
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Anmelden
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm text-muted-foreground">
        Noch kein Konto?&nbsp;
        <Link href="/register" className="text-primary font-medium hover:underline">
          Registrieren
        </Link>
      </CardFooter>
    </Card>
  )
}
