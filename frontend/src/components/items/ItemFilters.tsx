import type { ReactNode } from 'react'
import type { Collection } from '../../types'
import { itemSortOptions, type ItemFilterValues } from './useItemFilters'

interface ItemFiltersProps {
  collections?: Collection[]
  patterns: string[]
  filters: ItemFilterValues
  onChange: (filters: ItemFilterValues) => void
  onClear: () => void
}

const fieldClasses = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm'

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label>
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  )
}

export default function ItemFilters({ collections, patterns, filters, onChange, onClear }: ItemFiltersProps) {
  const { collection, status, difficulty, pattern, search, sort } = filters
  const hasActiveFilters = collection || status || difficulty || pattern || search

  return (
    <div className="surface p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Filters</h3>
        {hasActiveFilters && (
          <button type="button" onClick={onClear} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <FilterField label="Search">
          <input
            value={search}
            onChange={event => onChange({ ...filters, search: event.target.value })}
            placeholder="Search by title..."
            className={fieldClasses}
          />
        </FilterField>

        {collections && (
          <FilterField label="Collection">
            <select value={collection} onChange={event => onChange({ ...filters, collection: event.target.value })} className={fieldClasses}>
              <option value="">All Collections</option>
              {collections.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
            </select>
          </FilterField>
        )}

        <FilterField label="Status">
          <select value={status} onChange={event => onChange({ ...filters, status: event.target.value })} className={fieldClasses}>
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="learning">Learning</option>
            <option value="review">Review</option>
          </select>
        </FilterField>

        <FilterField label="Difficulty">
          <select value={difficulty} onChange={event => onChange({ ...filters, difficulty: event.target.value })} className={fieldClasses}>
            <option value="">All Difficulties</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </FilterField>

        <FilterField label="Pattern">
          <select value={pattern} onChange={event => onChange({ ...filters, pattern: event.target.value })} className={fieldClasses}>
            <option value="">All Patterns</option>
            {patterns.map(entry => <option key={entry}>{entry}</option>)}
          </select>
        </FilterField>

        <FilterField label="Sort By">
          <select value={sort} onChange={event => onChange({ ...filters, sort: event.target.value as ItemFilterValues['sort'] })} className={fieldClasses}>
            {Object.entries(itemSortOptions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </FilterField>
      </div>
    </div>
  )
}
