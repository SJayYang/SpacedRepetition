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
