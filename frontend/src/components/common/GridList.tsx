import { ReactNode } from 'react'

interface GridListProps {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4
}

export default function GridList({ children, columns = 3 }: GridListProps) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={`grid grid-cols-1 ${colClasses[columns]} gap-4`}>
      {children}
    </div>
  )
}
