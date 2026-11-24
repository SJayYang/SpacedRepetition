import { useEffect, useState, useMemo } from 'react'
import { itemsAPI, collectionsAPI } from '../api/client'
import { Item, Collection } from '../types'
import AddItemForm from '../components/items/AddItemForm'
import ItemCard from '../components/items/ItemCard'
import ItemFilters from '../components/items/ItemFilters'
import { useItemFilters } from '../components/items/useItemFilters'

export default function Items() {
  const [items, setItems] = useState<Item[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  const { filters, setFilters, patterns, filteredItems, clearFilters } = useItemFilters(items)

  useEffect(() => {
    let active = true
    Promise.all([itemsAPI.list({ limit: 500 }), collectionsAPI.list()])
      .then(([itemsData, collectionsData]) => {
        if (!active) return
        setItems(itemsData)
        setCollections(collectionsData)
      })
      .catch(error => console.error('Error loading items:', error))
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const collectionsById = useMemo(
    () => new Map(collections.map(collection => [collection.id, collection])),
    [collections],
  )

  const handleItemCreated = (item: Item) => {
    setItems(current => [item, ...current])
    setShowAddForm(false)
  }

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

      <AddItemForm collections={collections} hidden={!showAddForm} onCreated={handleItemCreated} />

      {/* Filters */}
      {items.length > 0 && (
        <ItemFilters
          collections={collections}
          patterns={patterns}
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
        />
      )}

      {/* Items List */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            collection={collectionsById.get(item.collection_id)}
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
            onClick={clearFilters}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  )
}
