import { getAccessToken } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL

export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const token = await getAccessToken()

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `API Error: ${response.status}`)
  }

  return response.json()
}

// Collections API
export const collectionsAPI = {
  list: () => apiClient('/api/collections'),
  create: (data: any) => apiClient('/api/collections', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  get: (id: string) => apiClient(`/api/collections/${id}`),
  update: (id: string, data: any) => apiClient(`/api/collections/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiClient(`/api/collections/${id}`, {
    method: 'DELETE',
  }),
}

// Items API
export const itemsAPI = {
  list: (params?: { collection_id?: string; archived?: boolean; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString()
    return apiClient(`/api/items${query ? '?' + query : ''}`)
  },
  create: (data: any) => apiClient('/api/items', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  bulkCreate: (data: any) => apiClient('/api/items/bulk', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  get: (id: string) => apiClient(`/api/items/${id}`),
  update: (id: string, data: any) => apiClient(`/api/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: string, archive = true) => apiClient(`/api/items/${id}?archive=${archive}`, {
    method: 'DELETE',
  }),
}

// Reviews API
export const reviewsAPI = {
  getDue: (params?: { limit?: number; collection_id?: string }) => {
    const query = new URLSearchParams(params as any).toString()
    return apiClient(`/api/reviews/due${query ? '?' + query : ''}`)
  },
  submit: (data: { item_id: string; rating: 1 | 2 | 3 | 4 }) => apiClient('/api/reviews', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getForecast: (days = 30) => apiClient(`/api/reviews/forecast?days=${days}`),
  getHistory: (limit = 100) => apiClient(`/api/reviews/history?limit=${limit}`),
}

// Analytics API
export const analyticsAPI = {
  getSummary: () => apiClient('/api/analytics/summary'),
  getRetention: (days = 30) => apiClient(`/api/analytics/retention?days=${days}`),
  getHeatmap: (days = 365) => apiClient(`/api/analytics/heatmap?days=${days}`),
  getTopics: () => apiClient('/api/analytics/topics'),
}

// Presets API
export const presetsAPI = {
  list: () => apiClient('/api/presets'),
  get: (name: string) => apiClient(`/api/presets/${name}`),
  import: (name: string, collectionId: string) => apiClient(`/api/presets/${name}/import`, {
    method: 'POST',
    body: JSON.stringify({ collection_id: collectionId }),
  }),
}

// Auth API
export const authAPI = {
  getMe: () => apiClient('/api/auth/me'),
  updateSettings: (settings: any) => apiClient('/api/auth/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  }),
}
