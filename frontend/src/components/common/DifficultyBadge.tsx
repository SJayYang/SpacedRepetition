interface DifficultyBadgeProps {
  difficulty: string
  size?: 'sm' | 'md' | 'lg'
}

const difficultyColors: Record<string, string> = {
  Easy: 'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Hard: 'bg-red-100 text-red-800',
}

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1 text-xs',
  md: 'px-4 py-1.5 text-sm',
  lg: 'px-5 py-2 text-base',
}

export default function DifficultyBadge({ difficulty, size = 'md' }: DifficultyBadgeProps) {
  const colorClass = difficultyColors[difficulty] || 'bg-gray-100 text-gray-800'
  const sizeClass = sizeClasses[size]

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colorClass} ${sizeClass}`}>
      {difficulty}
    </span>
  )
}
