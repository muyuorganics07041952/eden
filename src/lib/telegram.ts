const TELEGRAM_API = "https://api.telegram.org"

export async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) return

  try {
    await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    })
  } catch {
    // Non-critical — never block the main flow
  }
}

export function newUserMessage(email: string): string {
  const now = new Date().toLocaleString("de-AT", {
    timeZone: "Europe/Vienna",
    dateStyle: "short",
    timeStyle: "short",
  })
  return `🌱 <b>Neuer Eden-User!</b>\n\n📧 ${email}\n🕐 ${now}`
}
