import '../tailwind.css'
import type { View } from './types'
import { state } from './state'
import {
  dedupeMessagesById,
  renderChatView,
  attachChatListeners,
  loadConversations,
  loadMessages,
  startPolling,
} from './chat'
import { renderInsightsView, refreshInsights } from './insights'

const root = document.getElementById('root')!

function render(): void {
  dedupeMessagesById()
  const nav = `
  <nav class="border-b bg-white px-4 py-2 flex gap-2">
    <button type="button" data-nav="chat" class="px-3 py-1 rounded ${state.view === 'chat' ? 'bg-blue-100 font-medium' : 'hover:bg-gray-100'}">Chat</button>
    <button type="button" data-nav="insights" class="px-3 py-1 rounded ${state.view === 'insights' ? 'bg-blue-100 font-medium' : 'hover:bg-gray-100'}">Insights</button>
  </nav>`

  if (state.view === 'insights' && state.insights === null) {
    refreshInsights(render)
  }

  const content =
    state.view === 'insights' ? renderInsightsView() : renderChatView()

  let scrollTop = 0
  if (state.view === 'chat') {
    const chatScroll = document.getElementById('chat-scroll')
    if (chatScroll) scrollTop = chatScroll.scrollTop
  }

  root.innerHTML = `<div class="min-h-screen bg-gray-50">${nav}${content}</div>`

  if (state.view === 'chat' && scrollTop > 0) {
    const chatScroll = document.getElementById('chat-scroll')
    if (chatScroll) chatScroll.scrollTop = scrollTop
  }

  document.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', () => {
      state.view = (el as HTMLElement).dataset.nav as View
      render()
    })
  })

  if (state.view === 'chat') {
    attachChatListeners(render)
  }
}

;(async function init() {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = '/static/app/style.css'
  document.head.appendChild(link)
  await loadConversations()
  await loadMessages()
  startPolling(render)
  render()
})()
