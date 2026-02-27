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

const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
    .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
})

type UpdatePasswordForm = z.infer<typeof updatePasswordSchema>

export default function UpdatePasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<UpdatePasswordForm>({
    resolver: zodResolver(updatePasswordSchema),
  })

  async function onSubmit(data: UpdatePasswordForm) {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (updateError) {
        if (updateError.message.includes('expired') || updateError.message.includes('invalid')) {
          setError('Der Link ist abgelaufen. Bitte fordere einen neuen Link an.')
        } else {
          setError('Passwort konnte nicht aktualisiert werden. Bitte versuche es erneut.')
        }
        return
      }

      window.location.href = '/dashboard'
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
          <CardTitle className="text-2xl">Neues Passwort</CardTitle>
          <CardDescription>Wähle ein sicheres neues Passwort</CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Neues Passwort</Label>
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

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                className="pr-10"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showConfirm ? 'Passwort verbergen' : 'Passwort anzeigen'}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Passwort aktualisieren
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm text-muted-foreground">
        Link abgelaufen?&nbsp;
        <Link href="/reset-password" className="text-primary font-medium hover:underline">
          Neuen Link anfordern
        </Link>
      </CardFooter>
    </Card>
  )
}
