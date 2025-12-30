import { useEffect, useState } from 'react'
import { itemsAPI, collectionsAPI } from '../api/client'
import { Item, Collection } from '../types'

export default function Items() {
  const [items, setItems] = useState<Item[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
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
        itemsAPI.list(),
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

      await itemsAPI.create({
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
      loadData()
    } catch (err) {
      console.error('Error creating item:', err)
      alert('Failed to create item')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Items</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          {showAddForm ? 'Cancel' : 'Add Item'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 bg-white shadow rounded-lg p-6">
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

      {/* Items List */}
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {item.metadata.difficulty && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.metadata.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                      item.metadata.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.metadata.difficulty}
                    </span>
                  )}
                  {item.metadata.topics?.map((topic: string) => (
                    <span key={topic} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {topic}
                    </span>
                  ))}
                </div>
                {item.metadata.pattern && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Pattern:</span> {item.metadata.pattern}
                  </p>
                )}
                {item.notes && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Notes:</span> {item.notes}
                  </p>
                )}
                {item.scheduling_states && item.scheduling_states[0] && (
                  <p className="text-xs text-gray-500 mt-2">
                    Status: {item.scheduling_states[0].status} |
                    Next review: {new Date(item.scheduling_states[0].next_review_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              {item.external_url && (
                <a
                  href={item.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Open
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && !showAddForm && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No items yet. Add your first problem to get started!</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Add Problem
          </button>
        </div>
      )}
    </div>
  )
}
