interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  ariaLabel: string
}

const variantClasses: Record<string, string> = {
  primary: 'text-primary-600 hover:text-primary-700 hover:bg-primary-50',
  secondary: 'text-gray-600 hover:text-gray-700 hover:bg-gray-100',
  ghost: 'text-gray-400 hover:text-gray-600 hover:bg-gray-50',
}

const sizeClasses: Record<string, string> = {
  sm: 'p-1',
  md: 'p-2',
  lg: 'p-3',
}

export default function IconButton({
  children,
  variant = 'primary',
  size = 'md',
  ariaLabel,
  className = '',
  disabled,
  ...props
}: IconButtonProps) {
  const variantClass = variantClasses[variant]
  const sizeClass = sizeClasses[size]
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : ''

  return (
    <button
      className={`
        inline-flex items-center justify-center
        rounded-md
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
        ${variantClass}
        ${sizeClass}
        ${disabledClass}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      disabled={disabled}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  )
}
