export type Conversation = {
  id: number
  title: string | null
  created_at: string
  updated_at: string
}

export type Message = {
  id: number
  conversation: number
  role: 'user' | 'ai'
  text: string
  created_at: string
  sequence: number
  tempId?: string
  pending?: boolean
}

export type Feedback = {
  id: number
  message: number
  value: number
  created_at: string
}

export type Insights = {
  total_feedback_count: number
  average_value: number | null
  thumbs_up_count: number
  thumbs_down_count: number
}

export type View = 'chat' | 'insights'
