export interface Collection {
  id: string
  user_id: string
  name: string
  description?: string
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
  external_id?: string
  external_url?: string
  metadata: {
    difficulty?: string
    topics?: string[]
    pattern?: string
    companies?: string[]
    time_complexity?: string
    space_complexity?: string
    [key: string]: any
  }
  notes?: string
  created_at: string
  updated_at: string
  archived_at?: string
  scheduling_states?: SchedulingState[]
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
  last_review_at?: string
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  item_id: string
  user_id: string
  rating: 1 | 2 | 3 | 4
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
