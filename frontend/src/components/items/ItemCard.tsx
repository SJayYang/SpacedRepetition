import { useState, useEffect } from 'react'
import { Item, Collection } from '../../types'
import ReviewDateDisplay from '../common/ReviewDateDisplay'
import Badge from '../common/Badge'
import Button from '../common/Button'
import Card from '../common/Card'
import IconMenu from '../common/IconMenu'
import ConfirmDialog from '../common/ConfirmDialog'
import RatingSelector from './RatingSelector'
import { reviewsAPI } from '../../api/client'
import { getDifficultyVariant, getRatingLabel, getRatingVariant } from '../../utils/badgeHelpers'

interface ItemCardProps {
  item: Item
  collection?: Collection
  showPattern?: boolean
  showCollectionBadge?: boolean
  onOpen?: () => void
  onDelete?: () => void
  onRated?: () => void
  allowManualRating?: boolean
}

export default function ItemCard({ item, collection, showPattern = false, showCollectionBadge = true, onOpen, onDelete, onRated, allowManualRating = false }: ItemCardProps) {
  const [patternVisible, setPatternVisible] = useState(showPattern)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [localItem, setLocalItem] = useState(item)
  const schedulingState = localItem.scheduling_states?.[0]

  // Update local state when item prop changes
  useEffect(() => {
    setLocalItem(item)
  }, [item])

  const handleRate = async (rating: 1 | 2 | 3 | 4) => {
    try {
      // Optimistically update the UI
      const now = new Date().toISOString()
      const optimisticItem = {
        ...localItem,
        recent_review: {
          item_id: localItem.id,
          rating,
          reviewed_at: now
        }
      }
      setLocalItem(optimisticItem)

      // Submit to backend
      const response = await reviewsAPI.submit({ item_id: item.id, rating })

      // Update with real data from backend if available
      if (response) {
        setLocalItem({
          ...localItem,
          recent_review: {
            item_id: localItem.id,
            rating,
            reviewed_at: now
          },
          scheduling_states: localItem.scheduling_states ? [{
            ...localItem.scheduling_states[0],
            next_review_at: response.next_review_at,
            interval_days: response.interval_days,
            last_review_at: now
          }] : undefined
        })
      }

      if (onRated) {
        onRated()
      }
    } catch (err) {
      console.error('Error submitting rating:', err)
      alert('Failed to submit rating')
      // Revert optimistic update on error
      setLocalItem(item)
    }
  }

  return (
    <>
      <Card hoverable>
        {/* Header: Title, Difficulty, Status */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {localItem.title}
              </h3>
              {onDelete && (
                <IconMenu
                  ariaLabel="Item actions"
                  items={[
                    {
                      label: 'Delete Item',
                      icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      ),
                      onClick: () => setShowDeleteConfirm(true),
                      variant: 'danger',
                    },
                  ]}
                />
              )}
            </div>
          <div className="flex flex-wrap gap-2 items-center">
            {localItem.metadata?.difficulty && (
              <Badge variant={getDifficultyVariant(localItem.metadata.difficulty)} size="sm">
                {localItem.metadata.difficulty}
              </Badge>
            )}
            {localItem.recent_review && (
              <Badge variant={getRatingVariant(localItem.recent_review.rating)} size="sm" withBorder>
                Last: {getRatingLabel(localItem.recent_review.rating)}
              </Badge>
            )}
            {showCollectionBadge && collection && (
              <Badge variant="primary" size="sm">
                {collection.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Review Date - Prominent */}
        {schedulingState && (
          <div className="flex-shrink-0">
            <ReviewDateDisplay
              nextReviewAt={schedulingState.next_review_at}
              status={schedulingState.status}
              size="md"
            />
          </div>
        )}
      </div>

      {/* Pattern with Toggle */}
      {localItem.metadata?.pattern && (
        <div className="mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPatternVisible(!patternVisible)}
            icon={
              patternVisible ? (
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
            {patternVisible ? 'Hide Pattern' : 'Show Pattern'}
          </Button>
          {patternVisible && (
            <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-md">
              <div className="text-sm font-medium text-purple-900">
                Pattern: {localItem.metadata.pattern}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {localItem.notes && (
        <div className="mb-3">
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-200">
            <span className="font-medium text-gray-700">Notes: </span>
            <span className="whitespace-pre-wrap">{localItem.notes}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <div className="flex gap-2">
          {localItem.external_url && (
            <Button
              as="a"
              href={localItem.external_url}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              size="sm"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              }
            >
              Open Problem
            </Button>
          )}
          {onOpen && (
            <Button variant="secondary" size="sm" onClick={onOpen}>
              View Details
            </Button>
          )}
        </div>
        {allowManualRating && (
          <div className="flex-1">
            <RatingSelector
              onRate={handleRate}
              currentRating={localItem.recent_review?.rating}
            />
          </div>
        )}
      </div>
    </Card>

    {/* Delete Confirmation */}
    {onDelete && (
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Item?"
        message={`Are you sure you want to delete "${localItem.title}"? This action cannot be undone.`}
        confirmLabel="Delete Item"
        onConfirm={() => {
          onDelete()
          setShowDeleteConfirm(false)
        }}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />
    )}
  </>
  )
}
