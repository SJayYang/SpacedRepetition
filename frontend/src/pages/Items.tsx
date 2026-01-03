import { useEffect, useState, useMemo } from 'react'
import { itemsAPI, collectionsAPI } from '../api/client'
import { Item, Collection } from '../types'
import ItemCard from '../components/items/ItemCard'
import ItemFilters from '../components/items/ItemFilters'

export default function Items() {
  const [items, setItems] = useState<Item[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  // Filter states
  const [selectedCollection, setSelectedCollection] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [selectedPattern, setSelectedPattern] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('created_desc')

  const [formData, setFormData] = useState({
    collection_id: '',
    title: '',
    external_url: '',
    difficulty: 'Medium',
    topics: '',
    pattern: '',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [itemsData, collectionsData] = await Promise.all([
        itemsAPI.list({ limit: 500 }),
        collectionsAPI.list(),
      ])
      setItems(itemsData)
      setCollections(collectionsData)

      // Set default collection if available
      if (collectionsData.length > 0 && !formData.collection_id) {
        setFormData(prev => ({ ...prev, collection_id: collectionsData[0].id }))
      }
    } catch (err) {
      console.error('Error loading items:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.collection_id || !formData.title.trim()) {
      alert('Please fill in required fields')
      return
    }

    try {
      const topics = formData.topics.split(',').map(t => t.trim()).filter(t => t)

      const newItem = await itemsAPI.create({
        collection_id: formData.collection_id,
        title: formData.title,
        external_url: formData.external_url || undefined,
        metadata: {
          difficulty: formData.difficulty,
          topics,
          pattern: formData.pattern || undefined,
        },
        notes: formData.notes || undefined,
      })

      // Optimistically add to items list
      setItems([newItem, ...items])

      // Reset form
      setFormData({
        collection_id: collections[0]?.id || '',
        title: '',
        external_url: '',
        difficulty: 'Medium',
        topics: '',
        pattern: '',
        notes: '',
      })
      setShowAddForm(false)
    } catch (err) {
      console.error('Error creating item:', err)
      alert('Failed to create item')
    }
  }

  const handleClearFilters = () => {
    setSelectedCollection('')
    setSelectedStatus('')
    setSelectedDifficulty('')
    setSelectedPattern('')
    setSearchQuery('')
    setSortBy('created_desc')
  }

  // Extract unique patterns from items
  const uniquePatterns = useMemo(() => {
    const patterns = new Set<string>()
    items.forEach(item => {
      if (item.metadata?.pattern) {
        patterns.add(item.metadata.pattern)
      }
    })
    return Array.from(patterns).sort()
  }, [items])

  // Filter and search items
  const filteredItems = useMemo(() => {
    let filtered = items.filter(item => {
      // Collection filter
      if (selectedCollection && item.collection_id !== selectedCollection) {
        return false
      }

      // Status filter
      if (selectedStatus && item.scheduling_states?.[0]?.status !== selectedStatus) {
        return false
      }

      // Difficulty filter
      if (selectedDifficulty && item.metadata?.difficulty !== selectedDifficulty) {
        return false
      }

      // Pattern filter (exact match)
      if (selectedPattern && item.metadata?.pattern !== selectedPattern) {
        return false
      }

      // Search filter
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      return true
    })

    // Sort items
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'review_asc': {
          const aDate = a.scheduling_states?.[0]?.next_review_at
          const bDate = b.scheduling_states?.[0]?.next_review_at
          if (!aDate && !bDate) return 0
          if (!aDate) return 1
          if (!bDate) return -1
          return new Date(aDate).getTime() - new Date(bDate).getTime()
        }
        case 'review_desc': {
          const aDate = a.scheduling_states?.[0]?.next_review_at
          const bDate = b.scheduling_states?.[0]?.next_review_at
          if (!aDate && !bDate) return 0
          if (!aDate) return 1
          if (!bDate) return -1
          return new Date(bDate).getTime() - new Date(aDate).getTime()
        }
        case 'title_asc':
          return a.title.localeCompare(b.title)
        case 'title_desc':
          return b.title.localeCompare(a.title)
        default:
          return 0
      }
    })
  }, [items, selectedCollection, selectedStatus, selectedDifficulty, selectedPattern, searchQuery, sortBy])

  // Create a map of collection IDs to collection objects for quick lookup
  const collectionsMap = useMemo(() => {
    return collections.reduce((acc, collection) => {
      acc[collection.id] = collection
      return acc
    }, {} as Record<string, Collection>)
  }, [collections])

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Items</h1>
          <p className="text-gray-600 mt-1">
            Showing {filteredItems.length} of {items.length} items
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          {showAddForm ? 'Cancel' : 'Add Item'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 bg-white shadow rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Add New Problem</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Collection *
              </label>
              <select
                value={formData.collection_id}
                onChange={(e) => setFormData({ ...formData, collection_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Select a collection</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Two Sum"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LeetCode URL
              </label>
              <input
                type="url"
                value={formData.external_url}
                onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                placeholder="https://leetcode.com/problems/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topics (comma-separated)
              </label>
              <input
                type="text"
                value={formData.topics}
                onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                placeholder="Array, Hash Table, Two Pointers"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pattern
              </label>
              <input
                type="text"
                value={formData.pattern}
                onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Hash Map Lookup"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personal Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                placeholder="Your notes about this problem..."
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium"
            >
              Add Problem
            </button>
          </form>
        </div>
      )}

      {/* Filters */}
      {items.length > 0 && (
        <ItemFilters
          collections={collections}
          patterns={uniquePatterns}
          selectedCollection={selectedCollection}
          selectedStatus={selectedStatus}
          selectedDifficulty={selectedDifficulty}
          selectedPattern={selectedPattern}
          searchQuery={searchQuery}
          sortBy={sortBy}
          onCollectionChange={setSelectedCollection}
          onStatusChange={setSelectedStatus}
          onDifficultyChange={setSelectedDifficulty}
          onPatternChange={setSelectedPattern}
          onSearchChange={setSearchQuery}
          onSortChange={setSortBy}
          onClearFilters={handleClearFilters}
          showCollectionFilter={true}
        />
      )}

      {/* Items List */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            collection={collectionsMap[item.collection_id]}
            showPattern={false}
            allowManualRating={true}
          />
        ))}
      </div>

      {/* Empty States */}
      {items.length === 0 && !showAddForm && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 mb-4 mt-4">No items yet. Add your first problem to get started!</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Add Problem
          </button>
        </div>
      )}

      {items.length > 0 && filteredItems.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-600 mb-4 mt-4">No items match your filters.</p>
          <button
            onClick={handleClearFilters}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  )
}
