// Centralized badge helper functions

export const getDifficultyVariant = (difficulty: string): 'success' | 'warning' | 'danger' => {
  switch (difficulty) {
    case 'Easy':
      return 'success'
    case 'Medium':
      return 'warning'
    case 'Hard':
      return 'danger'
    default:
      return 'warning'
  }
}

export const getStatusVariant = (status: string): 'blue' | 'purple' | 'success' => {
  switch (status) {
    case 'new':
      return 'blue'
    case 'learning':
      return 'purple'
    case 'review':
      return 'success'
    default:
      return 'blue'
  }
}

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'new':
      return 'New'
    case 'learning':
      return 'Learning'
    case 'review':
      return 'Review'
    default:
      return 'New'
  }
}

export const getRatingLabel = (rating: 1 | 2 | 3 | 4): string => {
  const labels: Record<number, string> = {
    1: 'Forgot',
    2: 'Hard',
    3: 'Good',
    4: 'Easy',
  }
  return labels[rating] || 'Unknown'
}

export const getRatingVariant = (rating: 1 | 2 | 3 | 4): 'danger' | 'warning' | 'primary' | 'success' => {
  const variants: Record<number, 'danger' | 'warning' | 'primary' | 'success'> = {
    1: 'danger',
    2: 'warning',
    3: 'primary',
    4: 'success',
  }
  return variants[rating] || 'primary'
}
