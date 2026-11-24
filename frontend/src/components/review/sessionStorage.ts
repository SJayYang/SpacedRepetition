import type { DueItem } from '../../types'

interface SavedSession {
  collectionId: string | null
  currentIndex: number
  reviewsCompleted: number
  itemIds: string[]
  timestamp: number
}

const storageKey = 'review_session_state'
const sessionExpiryMs = 30 * 60 * 1000

export function saveReviewSession(session: Omit<SavedSession, 'timestamp'>) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ ...session, timestamp: Date.now() }))
  } catch (error) {
    console.error('Failed to save review session:', error)
  }
}

export function clearReviewSession() {
  try {
    localStorage.removeItem(storageKey)
  } catch (error) {
    console.error('Failed to clear review session:', error)
  }
}

export function restoreReviewSession(collectionId: string | null, dueItems: DueItem[]) {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null

    const saved: Partial<SavedSession> | null = JSON.parse(raw)
    if (
      !saved || saved.collectionId !== collectionId ||
      typeof saved.timestamp !== 'number' || Date.now() - saved.timestamp > sessionExpiryMs ||
      typeof saved.currentIndex !== 'number' || !Number.isInteger(saved.currentIndex) || saved.currentIndex < 0 ||
      typeof saved.reviewsCompleted !== 'number' || !Number.isInteger(saved.reviewsCompleted) || saved.reviewsCompleted < 0 ||
      !Array.isArray(saved.itemIds)
    ) return null

    const pendingIds = saved.itemIds.slice(saved.currentIndex)
    const itemsById = new Map(dueItems.map(item => [item.item_id, item]))
    const remaining = pendingIds.flatMap(id => {
      const item = itemsById.get(id)
      return item ? [item] : []
    })
    return remaining.length ? { remaining, reviewsCompleted: saved.reviewsCompleted } : null
  } catch (error) {
    console.error('Failed to restore review session:', error)
    return null
  }
}
