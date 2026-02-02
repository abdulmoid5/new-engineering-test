import type { Conversation, Feedback, Insights } from './types'

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

export type FeedbackListResponse = { results: Feedback[] }

export async function loadFeedback(messageId: number): Promise<Feedback[]> {
  const data = await api<FeedbackListResponse>(
    `messages/${messageId}/feedback/`
  )
  return data.results
}

export async function updateConversation(
  id: number,
  payload: { title: string | null }
): Promise<Conversation> {
  return api<Conversation>(`conversations/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteConversation(id: number): Promise<void> {
  await api(`conversations/${id}/`, { method: 'DELETE' })
}
