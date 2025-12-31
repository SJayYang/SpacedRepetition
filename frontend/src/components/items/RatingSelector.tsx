import { useState } from 'react'

interface RatingSelectorProps {
  onRate: (rating: 1 | 2 | 3 | 4) => Promise<void>
  currentRating?: 1 | 2 | 3 | 4
}

export default function RatingSelector({ onRate, currentRating }: RatingSelectorProps) {
  const [submitting, setSubmitting] = useState(false)

  const handleRate = async (rating: 1 | 2 | 3 | 4) => {
    try {
      setSubmitting(true)
      await onRate(rating)
    } finally {
      setSubmitting(false)
    }
  }

  const ratingOptions: Array<{ rating: 1 | 2 | 3 | 4; colorClasses: string; selectedClasses: string }> = [
    {
      rating: 1,
      colorClasses: 'bg-red-50 hover:bg-red-100 border-red-200 text-red-900',
      selectedClasses: 'bg-red-600 border-red-600 text-white hover:bg-red-700'
    },
    {
      rating: 2,
      colorClasses: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-900',
      selectedClasses: 'bg-orange-600 border-orange-600 text-white hover:bg-orange-700'
    },
    {
      rating: 3,
      colorClasses: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-900',
      selectedClasses: 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
    },
    {
      rating: 4,
      colorClasses: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-900',
      selectedClasses: 'bg-green-600 border-green-600 text-white hover:bg-green-700'
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2">
      {ratingOptions.map(({ rating, colorClasses, selectedClasses }) => {
        const isSelected = currentRating === rating
        return (
          <button
            key={rating}
            onClick={() => handleRate(rating)}
            disabled={submitting}
            className={`px-4 py-2 border-2 rounded-lg font-semibold transition-all ${
              isSelected ? selectedClasses : colorClasses
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {rating}
          </button>
        )
      })}
    </div>
  )
}
