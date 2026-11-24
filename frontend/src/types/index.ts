export type Rating = 1 | 2 | 3 | 4

export interface ItemMetadata {
  difficulty?: string
  topics?: string[]
  pattern?: string
  companies?: string[]
  time_complexity?: string
  space_complexity?: string
  [key: string]: unknown
}

export interface Collection {
  id: string
  user_id: string
  name: string
  description?: string | null
  item_type: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Item {
  id: string
  user_id: string
  collection_id: string
  title: string
  external_id?: string | null
  external_url?: string | null
  metadata: ItemMetadata
  notes?: string | null
  created_at: string
  updated_at: string
  archived_at?: string | null
  scheduling_states?: SchedulingState[]
  recent_review?: {
    item_id: string
    rating: Rating
    reviewed_at: string
  } | null
}

export interface SchedulingState {
  id: string
  item_id: string
  user_id: string
  ease_factor: number
  interval_days: number
  repetitions: number
  status: 'new' | 'learning' | 'review'
  next_review_at: string
  last_review_at?: string | null
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  item_id: string
  user_id: string
  rating: Rating
  ease_factor_before?: number
  interval_before?: number
  ease_factor_after?: number
  interval_after?: number
  reviewed_at: string
}

export interface DashboardStats {
  due_count: number
  overdue_count: number
  total_items: number
  reviews_today: number
  streak: number
  retention_rate: number
}

export interface Preset {
  id: string
  name: string
  description: string
  problem_count: number
}

export interface DueItem extends SchedulingState {
  items: Item
}

export interface ReviewResult {
  id: string
  item_id: string
  rating: Rating
  next_review_at: string
  interval_days: number
}

export interface RetentionPoint {
  date: string
  rate: number
  total_reviews: number
}

export interface TopicPerformance {
  topic: string
  total_reviews: number
  success_rate: number
}

export interface ProfileSettings {
  daily_review_limit: number
  new_items_per_day: number
  default_ease_factor: number
  timezone: string
}

export interface Profile extends ProfileSettings {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
}
