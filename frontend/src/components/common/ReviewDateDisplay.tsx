import { formatDistanceToNow, isPast, isToday, isTomorrow, parseISO } from 'date-fns'

interface ReviewDateDisplayProps {
  nextReviewAt: string
  status: 'new' | 'learning' | 'review'
  size?: 'sm' | 'md' | 'lg'
}

export default function ReviewDateDisplay({ nextReviewAt, status, size = 'md' }: ReviewDateDisplayProps) {
  const reviewDate = parseISO(nextReviewAt)
  const isOverdue = isPast(reviewDate) && !isToday(reviewDate)
  const isDueToday = isToday(reviewDate)
  const isDueTomorrow = isTomorrow(reviewDate)

  let bgColor = 'bg-gray-50 border-gray-200 text-gray-700'
  let urgencyLabel = 'Next review'

  if (status === 'new') {
    bgColor = 'bg-blue-50 border-blue-200 text-blue-700'
    urgencyLabel = 'Ready to learn'
  } else if (isOverdue) {
    bgColor = 'bg-red-50 border-red-300 text-red-800'
    urgencyLabel = 'Overdue'
  } else if (isDueToday) {
    bgColor = 'bg-orange-50 border-orange-300 text-orange-800'
    urgencyLabel = 'Due today'
  } else if (isDueTomorrow) {
    bgColor = 'bg-yellow-50 border-yellow-200 text-yellow-800'
    urgencyLabel = 'Due tomorrow'
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  }

  const timeText = status === 'new'
    ? 'Not started'
    : formatDistanceToNow(reviewDate, { addSuffix: true })

  return (
    <div className={`flex flex-col border rounded-lg ${bgColor} ${sizeClasses[size]}`}>
      <div className="font-semibold text-xs uppercase tracking-wide">{urgencyLabel}</div>
      <div className="font-medium mt-0.5">{timeText}</div>
    </div>
  )
}
