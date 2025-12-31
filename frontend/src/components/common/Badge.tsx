interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'blue'
  size?: 'sm' | 'md' | 'lg'
  withBorder?: boolean
  className?: string
}

const variantClasses: Record<string, string> = {
  default: 'bg-gray-100 text-gray-800',
  primary: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  purple: 'bg-purple-100 text-purple-800',
  blue: 'bg-blue-100 text-blue-800',
}

const borderClasses: Record<string, string> = {
  default: 'border-gray-200',
  primary: 'border-blue-200',
  success: 'border-green-200',
  warning: 'border-yellow-200',
  danger: 'border-red-200',
  purple: 'border-purple-200',
  blue: 'border-blue-200',
}

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1 text-xs',
  md: 'px-4 py-1.5 text-sm',
  lg: 'px-5 py-2 text-base',
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  withBorder = false,
  className = ''
}: BadgeProps) {
  const variantClass = variantClasses[variant]
  const sizeClass = sizeClasses[size]
  const borderClass = withBorder ? `border ${borderClasses[variant]}` : ''

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variantClass} ${sizeClass} ${borderClass} ${className}`}>
      {children}
    </span>
  )
}
