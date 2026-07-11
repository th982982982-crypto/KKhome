export function isNewSupportSession(
  lastCustomerMessageAt: string | null,
  gapMinutes: number,
  nowMs: number = Date.now()
): boolean {
  if (!lastCustomerMessageAt) return true
  return nowMs - new Date(lastCustomerMessageAt).getTime() > gapMinutes * 60_000
}

export function currentSupportSessionMessages<T extends { created_at: string }>(
  messages: T[],
  gapMinutes: number
): T[] {
  if (messages.length === 0) return messages
  const gapMs = gapMinutes * 60_000
  let startIndex = 0
  for (let i = 1; i < messages.length; i++) {
    const prev = new Date(messages[i - 1].created_at).getTime()
    const curr = new Date(messages[i].created_at).getTime()
    if (curr - prev > gapMs) startIndex = i
  }
  return messages.slice(startIndex)
}
