interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
  padding?: 'sm' | 'md' | 'lg'
}

const paddingClasses: Record<string, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export default function Card({
  children,
  className = '',
  onClick,
  hoverable = false,
  padding = 'md'
}: CardProps) {
  const paddingClass = paddingClasses[padding]
  const hoverClass = hoverable ? 'hover:shadow-xl transition-shadow cursor-pointer hover:border-primary-300' : ''
  const clickable = onClick ? 'cursor-pointer' : ''

  return (
    <div
      className={`bg-white shadow rounded-lg border border-gray-200 ${paddingClass} ${hoverClass} ${clickable} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
