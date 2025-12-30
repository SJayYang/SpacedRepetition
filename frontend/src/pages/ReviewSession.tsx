import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { reviewsAPI } from '../api/client'

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

export default function ReviewSession() {
  const navigate = useNavigate()
  const [dueItems, setDueItems] = useState<DueItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [reviewsCompleted, setReviewsCompleted] = useState(0)

  useEffect(() => {
    loadDueItems()
  }, [])

  const loadDueItems = async () => {
    try {
      setLoading(true)
      const data = await reviewsAPI.getDue({ limit: 50 })
      setDueItems(data)
      if (data.length === 0) {
        setSessionComplete(true)
      }
    } catch (err) {
      console.error('Error loading due items:', err)
      alert('Failed to load due items')
    } finally {
      setLoading(false)
    }
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

      // Move to next item or complete session
      if (currentIndex < dueItems.length - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        setSessionComplete(true)
      }
    } catch (err) {
      console.error('Error submitting review:', err)
      alert('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const currentItem = dueItems[currentIndex]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading review session...</div>
      </div>
    )
  }

  if (sessionComplete || dueItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {reviewsCompleted > 0 ? 'Session Complete!' : 'No items due for review'}
          </h2>
          {reviewsCompleted > 0 ? (
            <p className="text-gray-600 mb-6">
              You've completed {reviewsCompleted} review{reviewsCompleted !== 1 ? 's' : ''} today. Great work!
            </p>
          ) : (
            <p className="text-gray-600 mb-6">
              You're all caught up! Check back later for more reviews.
            </p>
          )}
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
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
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {currentItem.items.title}
          </h2>
          {currentItem.items.metadata?.difficulty && (
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              currentItem.items.metadata.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
              currentItem.items.metadata.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {currentItem.items.metadata.difficulty}
            </span>
          )}
        </div>

        {currentItem.items.metadata?.topics && currentItem.items.metadata.topics.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Topics:</h3>
            <div className="flex flex-wrap gap-2">
              {currentItem.items.metadata.topics.map((topic: string) => (
                <span key={topic} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {currentItem.items.metadata?.pattern && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700">Pattern:</h3>
            <p className="text-gray-900">{currentItem.items.metadata.pattern}</p>
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
      </div>
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
