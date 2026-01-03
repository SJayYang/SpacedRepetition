import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { collectionsAPI, itemsAPI } from '../api/client'
import { Collection, Item } from '../types'
import ItemCard from '../components/items/ItemCard'
import ItemFilters from '../components/items/ItemFilters'
import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import StatDisplay from '../components/common/StatDisplay'
import EmptyState from '../components/common/EmptyState'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EditDialog from '../components/common/EditDialog'
import IconMenu from '../components/common/IconMenu'

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Filter states
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [selectedPattern, setSelectedPattern] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('created_desc')

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    if (!id) return

    try {
      setLoading(true)
      const [collectionData, itemsData] = await Promise.all([
        collectionsAPI.get(id),
        itemsAPI.list({ collection_id: id, limit: 500 }),
      ])
      setCollection(collectionData)
      setItems(itemsData)
    } catch (err) {
      console.error('Error loading collection:', err)
      navigate('/collections')
    } finally {
      setLoading(false)
    }
  }

  const handleRename = async (newName: string) => {
    if (!id || !collection) return

    try {
      await collectionsAPI.update(id, { name: newName })
      setCollection({ ...collection, name: newName })
      setShowRenameDialog(false)
    } catch (err) {
      console.error('Error renaming collection:', err)
      alert('Failed to rename collection')
    }
  }

  const handleDelete = async () => {
    if (!id) return

    try {
      setDeleting(true)
      await collectionsAPI.delete(id)
      navigate('/collections')
    } catch (err) {
      console.error('Error deleting collection:', err)
      alert('Failed to delete collection')
      setDeleting(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      await itemsAPI.delete(itemId)
      setItems(items.filter(item => item.id !== itemId))
    } catch (err) {
      console.error('Error deleting item:', err)
      alert('Failed to delete item')
    }
  }

  const handleClearFilters = () => {
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

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let filtered = items.filter(item => {
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
  }, [items, selectedStatus, selectedDifficulty, selectedPattern, searchQuery, sortBy])

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  if (!collection) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Collection not found</p>
        <button
          onClick={() => navigate('/collections')}
          className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Back to Collections
        </button>
      </div>
    )
  }

  // Calculate statistics from all items (not filtered)
  const stats = {
    total: items.length,
    new: items.filter(item => item.scheduling_states?.[0]?.status === 'new').length,
    learning: items.filter(item => item.scheduling_states?.[0]?.status === 'learning').length,
    review: items.filter(item => item.scheduling_states?.[0]?.status === 'review').length,
    easy: items.filter(item => item.metadata?.difficulty === 'Easy').length,
    medium: items.filter(item => item.metadata?.difficulty === 'Medium').length,
    hard: items.filter(item => item.metadata?.difficulty === 'Hard').length,
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/collections')}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          }
          className="mb-4"
        >
          Back to Collections
        </Button>

        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{collection.name}</h1>
                <IconMenu
                  ariaLabel="Collection actions"
                  items={[
                    {
                      label: 'Rename Collection',
                      icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      ),
                      onClick: () => setShowRenameDialog(true),
                    },
                    {
                      label: 'Delete Collection',
                      icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      ),
                      onClick: () => setShowDeleteDialog(true),
                      variant: 'danger',
                    },
                  ]}
                />
              </div>
              {collection.description && (
                <p className="text-gray-600 mb-4">{collection.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Badge variant="primary">{collection.item_type}</Badge>
                {collection.is_default && <Badge variant="success">Default</Badge>}
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-6 pt-6 border-t border-gray-200">
            <StatDisplay label="Total" value={stats.total} />
            <StatDisplay label="New" value={stats.new} color="blue" />
            <StatDisplay label="Learning" value={stats.learning} color="purple" />
            <StatDisplay label="Review" value={stats.review} color="green" />
            <StatDisplay label="Easy" value={stats.easy} color="green" />
            <StatDisplay label="Medium" value={stats.medium} color="yellow" />
            <StatDisplay label="Hard" value={stats.hard} color="red" />
          </div>
        </Card>
      </div>

      {/* Items */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Problems <span className="text-gray-500">({filteredItems.length} of {items.length})</span>
        </h2>
        {stats.total > 0 && (stats.new > 0 || stats.learning > 0 || stats.review > 0) && (
          <Button
            variant="success"
            onClick={() => navigate(`/review?collection=${id}`)}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            Start Review Session
          </Button>
        )}
      </div>

      {/* Filters - only show if there are items */}
      {items.length > 0 && (
        <ItemFilters
          patterns={uniquePatterns}
          selectedStatus={selectedStatus}
          selectedDifficulty={selectedDifficulty}
          selectedPattern={selectedPattern}
          searchQuery={searchQuery}
          sortBy={sortBy}
          onStatusChange={setSelectedStatus}
          onDifficultyChange={setSelectedDifficulty}
          onPatternChange={setSelectedPattern}
          onSearchChange={setSearchQuery}
          onSortChange={setSortBy}
          onClearFilters={handleClearFilters}
          showCollectionFilter={false}
        />
      )}

      {filteredItems.length > 0 ? (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              collection={collection}
              showPattern={false}
              showCollectionBadge={false}
              onDelete={() => handleDeleteItem(item.id)}
              allowManualRating={true}
            />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-600 mb-4 mt-4">No items match your filters.</p>
          <Button
            onClick={handleClearFilters}
            variant="secondary"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <EmptyState
          title="No items in this collection yet"
          actionLabel="Add Items"
          onAction={() => navigate('/items')}
          variant="dashed"
        />
      )}

      {/* Rename Dialog */}
      <EditDialog
        isOpen={showRenameDialog}
        title="Rename Collection"
        label="Collection Name"
        initialValue={collection?.name || ''}
        placeholder="Enter new collection name"
        onSave={handleRename}
        onCancel={() => setShowRenameDialog(false)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Collection?"
        message={`Are you sure you want to delete "${collection?.name}"? This will delete all ${items.length} items in this collection. This action cannot be undone.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete Collection'}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        variant="danger"
      />
    </div>
  )
}
