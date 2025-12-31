import Button from './Button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  variant?: 'default' | 'dashed'
}

const defaultIcon = (
  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

export default function EmptyState({
  icon = defaultIcon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default'
}: EmptyStateProps) {
  const borderClass = variant === 'dashed' ? 'border-2 border-dashed border-gray-300' : 'border border-gray-200'

  return (
    <div className={`text-center py-12 bg-gray-50 rounded-lg ${borderClass}`}>
      {icon}
      <p className="text-gray-900 font-medium mb-2 mt-4">{title}</p>
      {description && <p className="text-gray-600 mb-4">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
