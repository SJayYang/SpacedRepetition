import { Link } from 'react-router-dom'

interface LinkButtonProps {
  to: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  className?: string
}

const variantClasses: Record<string, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
  secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  ghost: 'bg-transparent text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
}

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

export default function LinkButton({
  to,
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
}: LinkButtonProps) {
  const variantClass = variantClasses[variant]
  const sizeClass = sizeClasses[size]

  return (
    <Link
      to={to}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-md font-medium
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${variantClass}
        ${sizeClass}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </Link>
  )
}
