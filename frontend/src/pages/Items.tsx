import { LibraryBig, Plus, Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useEffect, useState, useMemo } from 'react'
import { itemsAPI, collectionsAPI } from '../api/client'
import { Item, Collection } from '../types'
import AddItemForm from '../components/items/AddItemForm'
import ItemCard from '../components/items/ItemCard'
import ItemFilters from '../components/items/ItemFilters'
import PageHeader from '../components/common/PageHeader'
import { useItemFilters } from '../components/items/useItemFilters'

export default function Items() {
  const [items, setItems] = useState<Item[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const showAddForm = searchParams.has('add')

  const setShowAddForm = (open: boolean) => {
    const next = new URLSearchParams(searchParams)
    if (open) next.set('add', '1')
    else next.delete('add')
    setSearchParams(next, { replace: true })
  }

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
    <div>
      <PageHeader
        title="Problems"
        subtitle={`Showing ${filteredItems.length} of ${items.length} problems`}
        actions={
          <button type="button" className={`ui-button ${showAddForm ? 'ui-button-secondary' : 'ui-button-primary'}`} onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : <><Plus size={17} aria-hidden="true" /> New problem</>}
          </button>
        }
      />

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

      {items.length === 0 && !showAddForm && (
        <div className="surface empty-panel">
          <LibraryBig size={24} aria-hidden="true" />
          <h2>No problems yet</h2>
          <p>Add a problem to start your library.</p>
          <button type="button" onClick={() => setShowAddForm(true)} className="ui-button ui-button-secondary">Add problem</button>
        </div>
      )}

      {items.length > 0 && filteredItems.length === 0 && (
        <div className="surface empty-panel">
          <Search size={24} aria-hidden="true" />
          <h2>No matching problems</h2>
          <button type="button" onClick={clearFilters} className="ui-button ui-button-secondary">Clear filters</button>
        </div>
      )}
    </div>
  )
}
