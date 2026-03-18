import { z } from 'zod'

export const createFeedbackSchema = z.object({
  type: z.enum(['bug', 'idea', 'praise']),
  text: z
    .string()
    .min(10, 'Bitte gib mindestens 10 Zeichen ein.')
    .max(1000, 'Maximal 1000 Zeichen erlaubt.'),
  page_url: z.string().min(1, 'Seiten-URL fehlt.').max(2000, 'URL ist zu lang.').regex(/^https?:\/\//, 'Ungültige URL.'),
})

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>
