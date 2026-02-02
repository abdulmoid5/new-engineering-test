import type { Conversation, Message, Insights, View } from './types'

export const state = {
  conversations: [] as Conversation[],
  current: null as Conversation | null,
  messages: [] as Message[],
  lastSeq: 0,
  pollTimer: 0 as ReturnType<typeof setInterval> | null,
  sending: false,
  view: 'chat' as View,
  feedbackByMessageId: {} as Record<number, number>,
  insights: null as Insights | null,
  editingConversationId: null as number | null,
}
