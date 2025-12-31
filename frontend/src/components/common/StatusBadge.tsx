interface StatusBadgeProps {
  status: 'new' | 'learning' | 'review'
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-800 border border-blue-200' },
  learning: { label: 'Learning', color: 'bg-purple-100 text-purple-800 border border-purple-200' },
  review: { label: 'Review', color: 'bg-green-100 text-green-800 border border-green-200' },
}

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1 text-xs',
  md: 'px-4 py-1.5 text-sm',
  lg: 'px-5 py-2 text-base',
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.new
  const sizeClass = sizeClasses[size]

  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${config.color} ${sizeClass}`}>
      {config.label}
    </span>
  )
}
