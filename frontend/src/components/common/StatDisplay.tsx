interface StatDisplayProps {
  label: string
  value: string | number
  color?: 'default' | 'blue' | 'purple' | 'green' | 'yellow' | 'red'
  size?: 'sm' | 'md' | 'lg'
}

const colorClasses: Record<string, string> = {
  default: 'text-gray-900',
  blue: 'text-blue-600',
  purple: 'text-purple-600',
  green: 'text-green-600',
  yellow: 'text-yellow-600',
  red: 'text-red-600',
}

const sizeClasses: Record<string, { value: string; label: string }> = {
  sm: { value: 'text-lg', label: 'text-xs' },
  md: { value: 'text-2xl', label: 'text-xs' },
  lg: { value: 'text-3xl', label: 'text-sm' },
}

export default function StatDisplay({
  label,
  value,
  color = 'default',
  size = 'md'
}: StatDisplayProps) {
  const colorClass = colorClasses[color]
  const sizeClass = sizeClasses[size]

  return (
    <div className="text-center">
      <div className={`${sizeClass.value} font-bold ${colorClass}`}>{value}</div>
      <div className={`${sizeClass.label} text-gray-600 uppercase tracking-wide mt-1`}>{label}</div>
    </div>
  )
}
