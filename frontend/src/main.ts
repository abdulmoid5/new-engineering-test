// Minimal client: conversations list, chat view, polling, feedback, insights
import '../tailwind.css'

type Conversation = { id: number; title: string | null; created_at: string; updated_at: string }
type Message = {
  id: number
  conversation: number
  role: 'user' | 'ai'
  text: string
  created_at: string
  sequence: number
  tempId?: string
  pending?: boolean
}

type Feedback = {
  id: number
  message: number
  value: number
  created_at: string
}

type Insights = {
  total_feedback_count: number
  average_value: number | null
  thumbs_up_count: number
  thumbs_down_count: number
}

const root = document.getElementById('root')!

const state = {
  conversations: [] as Conversation[],
  current: null as Conversation | null,
  messages: [] as Message[],
  lastSeq: 0,
  pollTimer: 0 as any,
  sending: false,
  view: 'chat' as 'chat' | 'insights',
  feedbackByMessageId: {} as Record<number, number>,
  insights: null as Insights | null,
}

async function api<T>(url: string, opts: RequestInit = {}): Promise<T> {
  const resp = await fetch(`/api/${url}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...opts,
  })
  if (!resp.ok) throw new Error(await resp.text())
  return resp.json()
}

async function submitFeedback(messageId: number, value: number): Promise<Feedback> {
  return api<Feedback>(`messages/${messageId}/feedback/`, {
    method: 'POST',
    body: JSON.stringify({ value }),
  })
}

async function fetchInsights(): Promise<Insights> {
  return api<Insights>('insights/')
}

async function loadConversations() {
  const data = await api<{ results: Conversation[]; count: number }>(`conversations/?limit=50`)
  state.conversations = data.results
  if (!state.current && state.conversations.length) state.current = state.conversations[0]
  render()
}

async function createConversation(title?: string) {
  const data = await api<Conversation>('conversations/', {
    method: 'POST',
    body: JSON.stringify({ title }),
  })
  state.conversations.unshift(data)
  state.current = data
  state.messages = []
  state.lastSeq = 0
  render()
}

async function loadMessages() {
  if (!state.current) return
  const data = await api<{ results: Message[]; lastSeq: number }>(
    `conversations/${state.current.id}/messages/?since=${state.lastSeq}`
  )
  if (data.results.length) {
    state.messages.push(...data.results)
    state.lastSeq = data.lastSeq
    dedupeMessagesById()
    render()
    scrollChatToBottom()
  }
}

async function sendMessage(text: string) {
  if (!state.current || state.sending) return
  state.sending = true
  render()
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
  render()
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
      (m) => m.id === res.ai_message.id || (m.sequence === res.ai_message.sequence && m.role === 'ai')
    )
    if (!hasAi) state.messages.push(res.ai_message)
    state.lastSeq = res.ai_message.sequence
    dedupeMessagesById()
    render()
    scrollChatToBottom()
  } catch (err) {
    const idx = state.messages.findIndex((m) => m.tempId === tempId)
    if (idx >= 0) state.messages.splice(idx, 1)
    render()
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
    render()
  }
}

function startPolling() {
  stopPolling()
  state.pollTimer = setInterval(loadMessages, 3000)
}
function stopPolling() {
  if (state.pollTimer) clearInterval(state.pollTimer)
}

function scrollChatToBottom() {
  const c = document.getElementById('chat-scroll')
  if (c) c.scrollTop = c.scrollHeight
}

function dedupeMessagesById() {
  const seen = new Set<number | string>()
  state.messages = state.messages.filter((m) => {
    const id = typeof m.id === 'number' ? m.id : Number(m.id)
    if (id >= 0 && seen.has(id)) return false
    if (id >= 0) seen.add(id)
    return true
  })
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

function renderChatView(): string {
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

function renderInsightsView(): string {
  const i = state.insights
  const rows = i
    ? `
    <tr><td class="p-2 border">Total feedback</td><td class="p-2 border">${i.total_feedback_count}</td></tr>
    <tr><td class="p-2 border">Thumbs up</td><td class="p-2 border">${i.thumbs_up_count}</td></tr>
    <tr><td class="p-2 border">Thumbs down</td><td class="p-2 border">${i.thumbs_down_count}</td></tr>
    <tr><td class="p-2 border">Average value</td><td class="p-2 border">${i.average_value ?? '—'}</td></tr>`
    : '<tr><td class="p-2 border" colspan="2">Loading…</td></tr>'
  return `
  <div class="mx-auto max-w-2xl p-4">
    <h2 class="text-xl font-semibold mb-4">Feedback insights</h2>
    <table class="w-full border border-gray-300 rounded overflow-hidden">
      <tbody>${rows}</tbody>
    </table>
  </div>`
}

function render() {
  dedupeMessagesById()
  const nav = `
  <nav class="border-b bg-white px-4 py-2 flex gap-2">
    <button type="button" data-nav="chat" class="px-3 py-1 rounded ${state.view === 'chat' ? 'bg-blue-100 font-medium' : 'hover:bg-gray-100'}">Chat</button>
    <button type="button" data-nav="insights" class="px-3 py-1 rounded ${state.view === 'insights' ? 'bg-blue-100 font-medium' : 'hover:bg-gray-100'}">Insights</button>
  </nav>`
  if (state.view === 'insights' && state.insights === null) {
    fetchInsights().then((data) => {
      state.insights = data
      render()
    })
  }

  const content = state.view === 'insights' ? renderInsightsView() : renderChatView()
  root.innerHTML = `<div class="min-h-screen bg-gray-50">${nav}${content}</div>`

  document.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', () => {
      const view = (el as HTMLElement).dataset.nav as 'chat' | 'insights'
      state.view = view
      render()
    })
  })

  if (state.view === 'chat') {
    document.getElementById('new-conv')?.addEventListener('click', () => {
      createConversation()
    })
    document.querySelectorAll('[data-cid]')?.forEach((el) => {
      el.addEventListener('click', () => {
        const cid = Number((el as HTMLElement).dataset.cid)
        const c = state.conversations.find((x) => x.id === cid) || null
        state.current = c
        state.messages = []
        state.lastSeq = 0
        render()
        loadMessages()
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
          render()
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
      await sendMessage(text)
    })
  }
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string
  )
}

// Boot
;(async function init() {
  // Inject Tailwind (built via PostCSS)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = '/static/app/style.css'
  document.head.appendChild(link)
  await loadConversations()
  await loadMessages()
  startPolling()
})()
