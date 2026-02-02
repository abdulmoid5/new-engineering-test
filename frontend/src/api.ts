import type { Feedback, Insights } from './types'

export async function api<T>(url: string, opts: RequestInit = {}): Promise<T> {
  const resp = await fetch(`/api/${url}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...opts,
  })
  if (!resp.ok) throw new Error(await resp.text())
  return resp.json()
}

export async function submitFeedback(
  messageId: number,
  value: number
): Promise<Feedback> {
  return api<Feedback>(`messages/${messageId}/feedback/`, {
    method: 'POST',
    body: JSON.stringify({ value }),
  })
}

export async function fetchInsights(): Promise<Insights> {
  return api<Insights>('insights/')
}
