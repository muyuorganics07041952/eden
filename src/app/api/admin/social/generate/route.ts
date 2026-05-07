import { NextResponse } from 'next/server'

export const maxDuration = 60
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTelegramMessage } from '@/lib/telegram'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const SUBREDDITS = [
  { sub: 'r/pflanzen', desc: 'Allgemeine deutschsprachige Pflanzen-Community' },
  { sub: 'r/garten', desc: 'Gartenpflege und Gartengestaltung' },
  { sub: 'r/balkonien', desc: 'Balkon- und Terrassengärtnern' },
  { sub: 'r/zimmerpflanzen', desc: 'Zimmerpflanzen und Innenraumbegrünung' },
  { sub: 'r/Austria', desc: 'Österreich-Community (Gartenthema)' },
]

const POST_ANGLES = [
  'Saisonaler Tipp passend zum aktuellen Monat',
  'Häufige Pflegefehler und wie man sie vermeidet',
  'Pflanzen-Vorstellung mit praktischen Pflegetipps',
  'Gieß-Guide: wann und wie viel',
  'Organisch düngen – was wirklich funktioniert',
  'Schädlinge früh erkennen und natürlich bekämpfen',
  'Pflanzen überwintern – was zu beachten ist',
  'Warum Pflanzen-Tagebücher das Gärtnern erleichtern',
]

export async function POST(request: Request) {
  const auth = request.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 })
  }

  const subreddit = SUBREDDITS[Math.floor(Math.random() * SUBREDDITS.length)]
  const angle = POST_ANGLES[Math.floor(Math.random() * POST_ANGLES.length)]
  const currentMonth = new Date().toLocaleString('de-AT', { month: 'long', timeZone: 'Europe/Vienna' })

  const prompt = `Du schreibst einen Reddit-Post für ${subreddit.sub} als echter Hobbygärtner. Thema: "${angle}". Monat: ${currentMonth}.

Schreibe so wie echte Reddit-User schreiben – nicht wie ein Ratgeber-Artikel oder KI-Text. Das bedeutet konkret:

- Kein perfekter Aufbau. Kein "Einleitung → Hauptteil → Fazit"
- Keine aufgeräumten Aufzählungslisten mit 5 gleich langen Punkten
- Schreib aus persönlicher Erfahrung: "Bei mir hat...", "Letztes Jahr ist mir...", "Ich hab festgestellt dass..."
- Umgangssprache ist ok. Sätze dürfen kurz und direkt sein.
- Ein konkretes Beispiel oder eine persönliche Situation einbauen
- Darf ruhig eine Frage am Ende haben oder offen bleiben
- Wenn Eden erwähnt wird: nur wenn es 100% natürlich passt, niemals als Werbung
- Kein Markdown außer wenn es wirklich hilft (keine künstlichen **Fettschriften**)
- Sprache: Österreichisch/Deutsch, du/dich

Antworte NUR als JSON:
{
  "title": "Titel (klingt wie von einem echten User, max 120 Zeichen)",
  "body": "Post-Text (120-200 Wörter, natürlich und persönlich)"
}`

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.85, responseMimeType: 'application/json' },
    }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    return NextResponse.json({ error: `Gemini error: ${res.status}` }, { status: 502 })
  }

  const geminiData = await res.json()
  const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
  if (!raw) {
    return NextResponse.json({ error: 'No content from Gemini' }, { status: 502 })
  }

  let post: { title: string; body: string }
  try {
    post = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON from Gemini' }, { status: 502 })
  }

  const generatedContent = `**${post.title}**\n\n${post.body}`

  function escapeHtml(text: string) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  const admin = createAdminClient()
  const { data: queued, error } = await admin
    .from('social_queue')
    .insert({
      platform: 'reddit',
      type: 'comment',
      target: subreddit.sub,
      generated_content: generatedContent,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const maxBody = 3000
  const bodyPreview = post.body.length > maxBody
    ? post.body.slice(0, maxBody).trimEnd() + '...'
    : post.body

  await sendTelegramMessage(
    `📝 <b>Neuer Reddit-Post-Entwurf</b>\n\n` +
    `🎯 ${escapeHtml(subreddit.sub)}\n` +
    `📌 <b>${escapeHtml(post.title)}</b>\n\n` +
    `${escapeHtml(bodyPreview)}\n\n` +
    `✏️ Kopiere den Text und poste ihn manuell auf Reddit.`
  )

  return NextResponse.json({ id: queued.id, target: subreddit.sub })
}
