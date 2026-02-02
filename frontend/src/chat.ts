import type { Conversation, Message } from './types'
import { state } from './state'
import { api, submitFeedback, loadFeedback } from './api'

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string
  )
}

export function dedupeMessagesById(): void {
  const seen = new Set<number | string>()
  state.messages = state.messages.filter((m) => {
    const id = typeof m.id === 'number' ? m.id : Number(m.id)
    if (id >= 0 && seen.has(id)) return false
    if (id >= 0) seen.add(id)
    return true
  })
}

export function scrollChatToBottom(): void {
  const c = document.getElementById('chat-scroll')
  if (c) c.scrollTop = c.scrollHeight
}

export async function loadConversations(): Promise<void> {
  const data = await api<{ results: Conversation[]; count: number }>(
    `conversations/?limit=50`
  )
  state.conversations = data.results
  if (!state.current && state.conversations.length) {
    state.current = state.conversations[0]
  }
}

export async function createConversation(title?: string): Promise<void> {
  const data = await api<Conversation>('conversations/', {
    method: 'POST',
    body: JSON.stringify({ title }),
  })
  state.conversations.unshift(data)
  state.current = data
  state.messages = []
  state.lastSeq = 0
}

async function loadFeedbackForCurrentMessages(): Promise<void> {
  const aiMessageIds = state.messages
    .filter((m) => m.role === 'ai' && m.id >= 0)
    .map((m) => m.id)
  if (aiMessageIds.length === 0) return
  const results = await Promise.all(
    aiMessageIds.map((id) => loadFeedback(id))
  )
  aiMessageIds.forEach((messageId, i) => {
    const feedbacks = results[i]
    const latest = feedbacks[0]
    if (latest !== undefined) {
      state.feedbackByMessageId[messageId] = latest.value
    }
  })
}

export async function loadMessages(): Promise<void> {
  if (!state.current) return
  const data = await api<{ results: Message[]; lastSeq: number }>(
    `conversations/${state.current.id}/messages/?since=${state.lastSeq}`
  )
  if (data.results.length) {
    state.messages.push(...data.results)
    state.lastSeq = data.lastSeq
    dedupeMessagesById()
    await loadFeedbackForCurrentMessages()
    scrollChatToBottom()
  }
}

export async function sendMessage(
  text: string,
  onRender: () => void
): Promise<void> {
  if (!state.current || state.sending) return
  state.sending = true
  onRender()
  const tempId = `tmp-${Date.now()}`
  const optimistic: Message = {
    id: -1,
    conversation: state.current.id,
    role: 'user',
    text,
    created_at: new Date().toISOString(),
    sequence: 0,
    tempId,
    pending: true,
  }
  state.messages.push(optimistic)
  onRender()
  scrollChatToBottom()

  await new Promise<void>((r) => requestAnimationFrame(() => r()))

  try {
    const res = await api<{ user_message: Message; ai_message: Message }>(
      `conversations/${state.current.id}/messages/`,
      {
        method: 'POST',
        body: JSON.stringify({ text }),
      }
    )
    const idx = state.messages.findIndex((m) => m.tempId === tempId)
    if (idx >= 0) {
      state.messages.splice(idx, 1, res.user_message)
    } else {
      const hasUser = state.messages.some((m) => m.id === res.user_message.id)
      if (!hasUser) state.messages.push(res.user_message)
    }
    const hasAi = state.messages.some(
      (m) =>
        m.id === res.ai_message.id ||
        (m.sequence === res.ai_message.sequence && m.role === 'ai')
    )
    if (!hasAi) state.messages.push(res.ai_message)
    state.lastSeq = res.ai_message.sequence
    dedupeMessagesById()
    onRender()
    scrollChatToBottom()
  } catch (err) {
    const idx = state.messages.findIndex((m) => m.tempId === tempId)
    if (idx >= 0) state.messages.splice(idx, 1)
    onRender()
    const msg = err instanceof Error ? err.message : 'Failed to send message.'
    let detail = msg
    try {
      const parsed = JSON.parse(msg)
      if (parsed && typeof parsed.detail === 'string') detail = parsed.detail
    } catch {
      /* use msg as-is */
    }
    alert(detail || 'Failed to send message. Please try again.')
  } finally {
    state.sending = false
    onRender()
  }
}

export function startPolling(onRender: () => void): void {
  stopPolling()
  state.pollTimer = setInterval(() => {
    loadMessages().then(onRender)
  }, 3000)
}

export function stopPolling(): void {
  if (state.pollTimer) {
    clearInterval(state.pollTimer)
    state.pollTimer = null
  }
}

function renderMessage(m: Message): string {
  const feedback = state.feedbackByMessageId[m.id]
  const thumbs =
    m.role === 'ai' && m.id >= 0
      ? `
            <div class="flex gap-1 mt-2">
              <button type="button" data-feedback data-mid="${m.id}" data-value="1" class="px-2 py-1 rounded text-sm ${feedback === 1 ? 'bg-green-200' : 'bg-gray-100 hover:bg-gray-200'}">👍</button>
              <button type="button" data-feedback data-mid="${m.id}" data-value="-1" class="px-2 py-1 rounded text-sm ${feedback === -1 ? 'bg-red-200' : 'bg-gray-100 hover:bg-gray-200'}">👎</button>
            </div>`
      : ''
  return `
          <div class="p-3 rounded ${m.role === 'user' ? 'msg-user' : 'msg-ai'}">
            <div class="text-xs text-gray-500 mb-1">${m.role.toUpperCase()} • ${new Date(m.created_at).toLocaleTimeString()}</div>
            <div class="whitespace-pre-wrap">${escapeHtml(m.text)}</div>
            ${thumbs}
          </div>`
}

export function renderChatView(): string {
  return `
  <div class="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
    <aside class="md:col-span-1 space-y-2">
      <div class="flex gap-2 items-center">
        <button id="new-conv" class="btn btn-primary">New Conversation</button>
      </div>
      <ul class="border rounded divide-y bg-white">
        ${state.conversations
          .map(
            (c) => `
          <li class="p-2 ${state.current?.id === c.id ? 'bg-blue-50' : ''}">
            <button data-cid="${c.id}" class="w-full text-left">${c.title ?? 'Untitled'}<br><span class="text-xs text-gray-500">${new Date(c.updated_at).toLocaleString()}</span></button>
          </li>
        `
          )
          .join('')}
      </ul>
    </aside>
    <main class="md:col-span-3 flex flex-col h-[80vh]">
      <div id="chat-scroll" class="flex-1 overflow-auto border rounded bg-white p-3 space-y-3">
        ${state.messages.map(renderMessage).join('')}
      </div>
      <form id="composer" class="mt-3 flex gap-2">
        <textarea id="input" class="textarea flex-1" rows="3" placeholder="Type a message (max 1000 chars)" ${state.sending ? 'disabled' : ''}></textarea>
        <button class="btn btn-primary" type="submit" ${state.sending ? 'disabled' : ''}>Send</button>
      </form>
    </main>
  </div>`
}

export function attachChatListeners(onRender: () => void): void {
  document.getElementById('new-conv')?.addEventListener('click', async () => {
    await createConversation()
    onRender()
  })
  document.querySelectorAll('[data-cid]').forEach((el) => {
    el.addEventListener('click', async () => {
      const cid = Number((el as HTMLElement).dataset.cid)
      const c = state.conversations.find((x) => x.id === cid) || null
      state.current = c
      state.messages = []
      state.lastSeq = 0
      onRender()
      await loadMessages()
      onRender()
    })
  })
  document.querySelectorAll('[data-feedback]').forEach((el) => {
    el.addEventListener('click', async () => {
      const mid = Number((el as HTMLElement).dataset.mid)
      const value = Number((el as HTMLElement).dataset.value)
      if (state.feedbackByMessageId[mid] !== undefined) return
      try {
        await submitFeedback(mid, value)
        state.feedbackByMessageId[mid] = value
        state.insights = null
        onRender()
      } catch {
        alert('Failed to submit feedback.')
      }
    })
  })
  const form = document.getElementById('composer') as HTMLFormElement
  form?.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (state.sending) return
    const input = document.getElementById('input') as HTMLTextAreaElement
    const text = input.value.trim()
    if (!text) return
    if (text.length > 1000) {
      alert('Message too long')
      return
    }
    input.value = ''
    await sendMessage(text, onRender)
  })
}
