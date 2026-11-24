import { useMemo, useState } from 'react'
import type { Item } from '../../types'

export const itemSortOptions = {
  created_desc: 'Newest First',
  created_asc: 'Oldest First',
  review_asc: 'Next Review (Soonest)',
  review_desc: 'Next Review (Latest)',
  title_asc: 'Title (A-Z)',
  title_desc: 'Title (Z-A)',
}

export interface ItemFilterValues {
  collection: string
  status: string
  difficulty: string
  pattern: string
  search: string
  sort: keyof typeof itemSortOptions
}

const defaultFilters: ItemFilterValues = {
  collection: '',
  status: '',
  difficulty: '',
  pattern: '',
  search: '',
  sort: 'created_desc',
}

function compareReviewDates(a: Item, b: Item, direction: number) {
  const first = a.scheduling_states?.[0]?.next_review_at
  const second = b.scheduling_states?.[0]?.next_review_at
  if (!first || !second) return Number(!first) - Number(!second)
  return direction * (Date.parse(first) - Date.parse(second))
}

const itemComparators: Record<ItemFilterValues['sort'], (a: Item, b: Item) => number> = {
  created_desc: (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
  created_asc: (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
  review_asc: (a, b) => compareReviewDates(a, b, 1),
  review_desc: (a, b) => compareReviewDates(a, b, -1),
  title_asc: (a, b) => a.title.localeCompare(b.title),
  title_desc: (a, b) => b.title.localeCompare(a.title),
}

export function useItemFilters(items: Item[]) {
  const [filters, setFilters] = useState(defaultFilters)
  const patterns = useMemo(() => {
    const unique = new Set<string>()
    for (const item of items) {
      if (item.metadata?.pattern) unique.add(item.metadata.pattern)
    }
    return [...unique].sort()
  }, [items])

  const filteredItems = useMemo(() => {
    const { collection, status, difficulty, pattern, search, sort } = filters
    const titleQuery = search.toLowerCase()
    return items.filter(item =>
      (!collection || item.collection_id === collection) &&
      (!status || item.scheduling_states?.[0]?.status === status) &&
      (!difficulty || item.metadata?.difficulty === difficulty) &&
      (!pattern || item.metadata?.pattern === pattern) &&
      (!titleQuery || item.title.toLowerCase().includes(titleQuery))
    ).sort(itemComparators[sort])
  }, [items, filters])

  return { filters, setFilters, patterns, filteredItems, clearFilters: () => setFilters(defaultFilters) }
}
