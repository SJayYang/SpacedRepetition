import { Collection } from '../../types'

interface ItemFiltersProps {
  collections?: Collection[]
  patterns?: string[]
  selectedCollection?: string
  selectedStatus: string
  selectedDifficulty: string
  selectedPattern?: string
  searchQuery: string
  sortBy: string
  onCollectionChange?: (value: string) => void
  onStatusChange: (value: string) => void
  onDifficultyChange: (value: string) => void
  onPatternChange?: (value: string) => void
  onSearchChange: (value: string) => void
  onSortChange: (value: string) => void
  onClearFilters: () => void
  showCollectionFilter?: boolean
}

export default function ItemFilters({
  collections = [],
  patterns = [],
  selectedCollection = '',
  selectedStatus,
  selectedDifficulty,
  selectedPattern = '',
  searchQuery,
  sortBy,
  onCollectionChange,
  onStatusChange,
  onDifficultyChange,
  onPatternChange,
  onSearchChange,
  onSortChange,
  onClearFilters,
  showCollectionFilter = true,
}: ItemFiltersProps) {
  const hasActiveFilters = selectedCollection || selectedStatus || selectedDifficulty || selectedPattern || searchQuery

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Collection Filter - conditionally rendered */}
        {showCollectionFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Collection
            </label>
            <select
              value={selectedCollection}
              onChange={(e) => onCollectionChange?.(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="">All Collections</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="learning">Learning</option>
            <option value="review">Review</option>
          </select>
        </div>

        {/* Difficulty Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Difficulty
          </label>
          <select
            value={selectedDifficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        {/* Pattern Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pattern
          </label>
          <select
            value={selectedPattern}
            onChange={(e) => onPatternChange?.(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          >
            <option value="">All Patterns</option>
            {patterns.map((pattern) => (
              <option key={pattern} value={pattern}>
                {pattern}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          >
            <option value="created_desc">Newest First</option>
            <option value="created_asc">Oldest First</option>
            <option value="review_asc">Next Review (Soonest)</option>
            <option value="review_desc">Next Review (Latest)</option>
            <option value="title_asc">Title (A-Z)</option>
            <option value="title_desc">Title (Z-A)</option>
          </select>
        </div>
      </div>
    </div>
  )
}
