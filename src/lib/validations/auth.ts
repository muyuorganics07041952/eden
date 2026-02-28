import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Bitte eine gultige E-Mail-Adresse eingeben'),
  // BUG-6 fix: login only checks non-empty, not complexity rules
  password: z.string().min(1, 'Bitte Passwort eingeben'),
})

export const registerSchema = z.object({
  email: z.string().email('Bitte eine gultige E-Mail-Adresse eingeben'),
  password: z
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Grossbuchstaben enthalten')
    .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Bitte eine gultige E-Mail-Adresse eingeben'),
})

export const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Grossbuchstaben enthalten')
    .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>
