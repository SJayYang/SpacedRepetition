import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { collectionsAPI, itemsAPI } from '../api/client'
import { Collection, Item } from '../types'
import ItemCard from '../components/items/ItemCard'
import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import StatDisplay from '../components/common/StatDisplay'
import EmptyState from '../components/common/EmptyState'

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    if (!id) return

    try {
      setLoading(true)
      const [collectionData, itemsData] = await Promise.all([
        collectionsAPI.get(id),
        itemsAPI.list({ collection_id: id }),
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

  // Calculate statistics
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{collection.name}</h1>
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
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Problems <span className="text-gray-500">({items.length})</span>
        </h2>
      </div>

      {items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              collection={collection}
              showPattern={false}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No items in this collection yet"
          actionLabel="Add Items"
          onAction={() => navigate('/items')}
          variant="dashed"
        />
      )}
    </div>
  )
}
