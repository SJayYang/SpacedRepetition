import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { reviewsAPI, collectionsAPI } from '../api/client'
import { Collection } from '../types'
import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import CollectionSelector from '../components/review/CollectionSelector'
import { getDifficultyVariant } from '../utils/badgeHelpers'

interface DueItem {
  id: string
  item_id: string
  items: {
    id: string
    title: string
    external_url?: string
    metadata: any
    notes?: string
  }
}

interface SessionState {
  collectionId: string | null
  currentIndex: number
  reviewsCompleted: number
  itemIds: string[]
  timestamp: number
}

const SESSION_STORAGE_KEY = 'review_session_state'
const SESSION_EXPIRY_MS = 30 * 60 * 1000 // 30 minutes

function saveSessionState(state: SessionState) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('Failed to save session state:', err)
  }
}

function loadSessionState(): SessionState | null {
  try {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!saved) return null

    const state: SessionState = JSON.parse(saved)

    // Check if session has expired
    if (Date.now() - state.timestamp > SESSION_EXPIRY_MS) {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      return null
    }

    return state
  } catch (err) {
    console.error('Failed to load session state:', err)
    return null
  }
}

function clearSessionState() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch (err) {
    console.error('Failed to clear session state:', err)
  }
}

export default function ReviewSession() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const collectionIdParam = searchParams.get('collection')

  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(collectionIdParam)
  const [showCollectionSelector, setShowCollectionSelector] = useState(!collectionIdParam)
  const [dueItems, setDueItems] = useState<DueItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [reviewsCompleted, setReviewsCompleted] = useState(0)
  const [showPattern, setShowPattern] = useState(false)
  const [sessionRestored, setSessionRestored] = useState(false)
  const [showRestoredMessage, setShowRestoredMessage] = useState(false)

  useEffect(() => {
    loadCollections()
  }, [])

  useEffect(() => {
    if (selectedCollectionId !== null || !showCollectionSelector) {
      loadDueItems()
    }
  }, [selectedCollectionId, showCollectionSelector])

  // Save session state whenever progress changes
  useEffect(() => {
    if (dueItems.length > 0 && !sessionComplete) {
      const state: SessionState = {
        collectionId: selectedCollectionId,
        currentIndex,
        reviewsCompleted,
        itemIds: dueItems.map(item => item.item_id),
        timestamp: Date.now(),
      }
      saveSessionState(state)
    }
  }, [currentIndex, reviewsCompleted, dueItems, selectedCollectionId, sessionComplete])

  const loadCollections = async () => {
    try {
      const data = await collectionsAPI.list()
      setCollections(data)
    } catch (err) {
      console.error('Error loading collections:', err)
    }
  }

  const loadDueItems = async () => {
    try {
      setLoading(true)
      const params: any = { limit: 50 }
      if (selectedCollectionId) {
        params.collection_id = selectedCollectionId
      }
      const data = await reviewsAPI.getDue(params)
      setDueItems(data)

      if (data.length === 0) {
        setSessionComplete(true)
        clearSessionState()
        return
      }

      // Try to restore previous session state
      if (!sessionRestored) {
        const savedState = loadSessionState()
        if (savedState && savedState.collectionId === selectedCollectionId) {
          // Verify the saved item IDs match current due items
          const currentItemIds = data.map((item: DueItem) => item.item_id)
          const hasMatchingItems = savedState.itemIds.every(id => currentItemIds.includes(id))

          if (hasMatchingItems && savedState.currentIndex < data.length) {
            setCurrentIndex(savedState.currentIndex)
            setReviewsCompleted(savedState.reviewsCompleted)
            setSessionRestored(true)
            setShowRestoredMessage(true)
            // Hide message after 5 seconds
            setTimeout(() => setShowRestoredMessage(false), 5000)
          } else {
            // Session is stale, clear it
            clearSessionState()
          }
        }
        setSessionRestored(true)
      }
    } catch (err) {
      console.error('Error loading due items:', err)
      alert('Failed to load due items')
    } finally {
      setLoading(false)
    }
  }

  const handleCollectionSelect = (collectionId: string | null) => {
    setSelectedCollectionId(collectionId)
    setShowCollectionSelector(false)
  }

  const handleChangeCollection = () => {
    clearSessionState()
    setShowCollectionSelector(true)
    setSessionComplete(false)
    setCurrentIndex(0)
    setReviewsCompleted(0)
    setSessionRestored(false)
  }

  const handleRating = async (rating: 1 | 2 | 3 | 4) => {
    if (!currentItem) return

    try {
      setSubmitting(true)
      await reviewsAPI.submit({
        item_id: currentItem.items.id,
        rating,
      })

      setReviewsCompleted(prev => prev + 1)

      // Reset pattern visibility for next item
      setShowPattern(false)

      // Move to next item or complete session
      if (currentIndex < dueItems.length - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        setSessionComplete(true)
        clearSessionState()
      }
    } catch (err) {
      console.error('Error submitting review:', err)
      alert('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const currentItem = dueItems[currentIndex]

  if (showCollectionSelector) {
    return (
      <CollectionSelector
        collections={collections}
        onSelect={handleCollectionSelect}
        onCancel={() => navigate('/dashboard')}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading review session...</div>
      </div>
    )
  }

  const selectedCollection = selectedCollectionId
    ? collections.find(c => c.id === selectedCollectionId)
    : null

  if (sessionComplete || dueItems.length === 0) {
    const collectionName = selectedCollection ? selectedCollection.name : 'All Collections'

    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card padding="lg" className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {reviewsCompleted > 0 ? 'Session Complete!' : 'No items due for review'}
          </h2>
          {reviewsCompleted > 0 ? (
            <p className="text-gray-600 mb-6">
              You've completed {reviewsCompleted} review{reviewsCompleted !== 1 ? 's' : ''} from {collectionName}. Great work!
            </p>
          ) : (
            <p className="text-gray-600 mb-6">
              No items due for review in {collectionName}. Check back later!
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleChangeCollection}
              variant="secondary"
              size="lg"
            >
              Review Different Collection
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="primary"
              size="lg"
            >
              Return to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const collectionName = selectedCollection ? selectedCollection.name : 'All Collections'

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Restored Session Message */}
      {showRestoredMessage && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-blue-900">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">Session restored! Continuing from where you left off.</span>
        </div>
      )}

      {/* Collection Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="primary" size="sm">{collectionName}</Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleChangeCollection}
          >
            Change Collection
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{currentIndex + 1} / {dueItems.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / dueItems.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Item */}
      <Card padding="lg" className="shadow-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {currentItem.items.title}
          </h2>
          {currentItem.items.metadata?.difficulty && (
            <Badge variant={getDifficultyVariant(currentItem.items.metadata.difficulty)} size="sm">
              {currentItem.items.metadata.difficulty}
            </Badge>
          )}
        </div>

        {currentItem.items.metadata?.pattern && (
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPattern(!showPattern)}
              icon={
                showPattern ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )
              }
            >
              {showPattern ? 'Hide Pattern' : 'Show Pattern (Hint)'}
            </Button>
            {showPattern && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg mt-2">
                <h3 className="text-sm font-medium text-purple-900 mb-1">Pattern:</h3>
                <p className="text-purple-900 font-medium">{currentItem.items.metadata.pattern}</p>
              </div>
            )}
          </div>
        )}

        {currentItem.items.notes && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Your Notes:</h3>
            <p className="text-gray-900 whitespace-pre-wrap">{currentItem.items.notes}</p>
          </div>
        )}

        {currentItem.items.external_url && (
          <div className="mb-6">
            <a
              href={currentItem.items.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Open in LeetCode →
            </a>
          </div>
        )}

        {/* Rating Buttons */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            How well did you recall this problem?
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <RatingButton
              label="Forgot"
              description="Couldn't recall at all"
              color="red"
              onClick={() => handleRating(1)}
              disabled={submitting}
            />
            <RatingButton
              label="Hard"
              description="Recalled with struggle"
              color="orange"
              onClick={() => handleRating(2)}
              disabled={submitting}
            />
            <RatingButton
              label="Good"
              description="Recalled with effort"
              color="blue"
              onClick={() => handleRating(3)}
              disabled={submitting}
            />
            <RatingButton
              label="Easy"
              description="Instant recall"
              color="green"
              onClick={() => handleRating(4)}
              disabled={submitting}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}

function RatingButton({ label, description, color, onClick, disabled }: {
  label: string
  description: string
  color: string
  onClick: () => void
  disabled: boolean
}) {
  const colorClasses: Record<string, string> = {
    red: 'bg-red-50 hover:bg-red-100 border-red-200 text-red-900',
    orange: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-900',
    blue: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-900',
    green: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-900',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-4 border-2 rounded-lg transition-all ${colorClasses[color]} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <div className="font-semibold text-lg">{label}</div>
      <div className="text-sm opacity-75">{description}</div>
    </button>
  )
}
