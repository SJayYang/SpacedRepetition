import { getAccessToken } from '../lib/supabase'
import type {
  Collection,
  DashboardStats,
  DueItem,
  Item,
  ItemMetadata,
  Preset,
  Profile,
  ProfileSettings,
  Rating,
  RetentionPoint,
  Review,
  ReviewResult,
  TopicPerformance,
} from '../types'

const apiUrl = import.meta.env.VITE_API_URL

type QueryParams = Record<string, string | number | boolean | undefined>
type CollectionInput = Pick<Collection, 'name' | 'description'> & Partial<Pick<Collection, 'item_type' | 'is_default'>>
type NewItem = Pick<Item, 'title' | 'external_id' | 'external_url' | 'notes'> & { metadata?: ItemMetadata }
type ItemUpdate = Partial<Omit<NewItem, 'external_id'>>
type CountByDate = { date: string; count: number }

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken()
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${apiUrl}${endpoint}`, { ...options, headers })
  if (!response.ok) {
    const error: { detail?: unknown } | null = await response.json().catch(() => null)
    const message = typeof error?.detail === 'string' ? error.detail : `API error (${response.status})`
    throw new Error(message)
  }

  return response.json()
}

function withQuery(path: string, values: QueryParams = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) query.set(key, String(value))
  }
  const serialized = query.toString()
  return serialized ? `${path}?${serialized}` : path
}

function write<T>(path: string, method: 'POST' | 'PATCH', data: object) {
  return request<T>(path, { method, body: JSON.stringify(data) })
}

export const collectionsAPI = {
  list: () => request<Collection[]>('/api/collections/'),
  create: (data: CollectionInput) => write<Collection>('/api/collections/', 'POST', data),
  get: (id: string) => request<Collection>(`/api/collections/${id}`),
  update: (id: string, data: Partial<Pick<CollectionInput, 'name' | 'description'>>) =>
    write<Collection>(`/api/collections/${id}`, 'PATCH', data),
  delete: (id: string) => request<{ message: string }>(`/api/collections/${id}`, { method: 'DELETE' }),
}

export const itemsAPI = {
  list: (params?: { collection_id?: string; archived?: boolean; limit?: number }) =>
    request<Item[]>(withQuery('/api/items/', params)),
  create: (data: NewItem & { collection_id: string }) => write<Item>('/api/items/', 'POST', data),
  bulkCreate: (data: { collection_id: string; items: NewItem[] }) =>
    write<{ message: string; items: Item[] }>('/api/items/bulk', 'POST', data),
  get: (id: string) => request<Item>(`/api/items/${id}`),
  update: (id: string, data: ItemUpdate) => write<Item>(`/api/items/${id}`, 'PATCH', data),
  delete: (id: string, archive = true) =>
    request<Item | { message: string }>(withQuery(`/api/items/${id}`, { archive }), { method: 'DELETE' }),
}

export const reviewsAPI = {
  getDue: (params?: { limit?: number; collection_id?: string }) =>
    request<DueItem[]>(withQuery('/api/reviews/due', params)),
  submit: (data: { item_id: string; rating: Rating }) => write<ReviewResult>('/api/reviews/', 'POST', data),
  getForecast: (days = 30) => request<CountByDate[]>(withQuery('/api/reviews/forecast', { days })),
  getHistory: (limit = 100) =>
    request<Array<Review & { items: Pick<Item, 'title' | 'metadata'> }>>(withQuery('/api/reviews/history', { limit })),
}

export const analyticsAPI = {
  getSummary: () => request<DashboardStats>('/api/analytics/summary'),
  getRetention: (days = 30) => request<RetentionPoint[]>(withQuery('/api/analytics/retention', { days })),
  getHeatmap: (days = 365, time_zone?: string) => request<CountByDate[]>(withQuery('/api/analytics/heatmap', { days, time_zone })),
  getTopics: () => request<TopicPerformance[]>('/api/analytics/topics'),
}

export const presetsAPI = {
  list: () => request<Preset[]>('/api/presets/'),
  get: (name: string) => request<Pick<Preset, 'name' | 'description'> & { problems: NewItem[] }>(`/api/presets/${name}`),
  import: (name: string, collectionId: string) =>
    write<{ message: string; items_created: number; items_skipped: number }>(`/api/presets/${name}/import`, 'POST', {
      collection_id: collectionId,
    }),
}

export const authAPI = {
  getMe: () => request<Profile>('/api/auth/me'),
  updateSettings: (settings: ProfileSettings) => write<Profile>('/api/auth/settings', 'PATCH', settings),
}
