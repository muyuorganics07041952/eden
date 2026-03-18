export type FeedbackType = 'bug' | 'idea' | 'praise'

export interface Feedback {
  id: string
  user_id: string | null
  type: FeedbackType
  text: string
  page_url: string
  created_at: string
}
