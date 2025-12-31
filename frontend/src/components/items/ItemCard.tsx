import { useState } from 'react'
import { Item, Collection } from '../../types'
import ReviewDateDisplay from '../common/ReviewDateDisplay'
import Badge from '../common/Badge'
import Button from '../common/Button'
import Card from '../common/Card'
import { getDifficultyVariant, getStatusVariant, getStatusLabel } from '../../utils/badgeHelpers'

interface ItemCardProps {
  item: Item
  collection?: Collection
  showPattern?: boolean
  onOpen?: () => void
}

export default function ItemCard({ item, collection, showPattern = false, onOpen }: ItemCardProps) {
  const [patternVisible, setPatternVisible] = useState(showPattern)
  const schedulingState = item.scheduling_states?.[0]

  return (
    <Card hoverable>
      {/* Header: Title, Difficulty, Status */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {item.title}
          </h3>
          <div className="flex flex-wrap gap-2 items-center">
            {item.metadata?.difficulty && (
              <Badge variant={getDifficultyVariant(item.metadata.difficulty)} size="sm">
                {item.metadata.difficulty}
              </Badge>
            )}
            {schedulingState && (
              <Badge variant={getStatusVariant(schedulingState.status)} size="sm" withBorder>
                {getStatusLabel(schedulingState.status)}
              </Badge>
            )}
            {collection && (
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

      {/* Topics */}
      {item.metadata?.topics && item.metadata.topics.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1.5">
            {item.metadata.topics.map((topic: string) => (
              <Badge key={topic} size="sm">
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Pattern with Toggle */}
      {item.metadata?.pattern && (
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
                Pattern: {item.metadata.pattern}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {item.notes && (
        <div className="mb-3">
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-200">
            <span className="font-medium text-gray-700">Notes: </span>
            <span className="whitespace-pre-wrap">{item.notes}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        {item.external_url && (
          <Button
            as="a"
            href={item.external_url}
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
    </Card>
  )
}
