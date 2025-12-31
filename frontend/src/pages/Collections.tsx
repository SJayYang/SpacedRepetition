import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { collectionsAPI, presetsAPI } from '../api/client'
import { Collection, Preset } from '../types'

export default function Collections() {
  const navigate = useNavigate()
  const [collections, setCollections] = useState<Collection[]>([])
  const [presets, setPresets] = useState<Preset[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [importCollectionId, setImportCollectionId] = useState<string>('')

  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name_asc')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [collectionsData, presetsData] = await Promise.all([
        collectionsAPI.list(),
        presetsAPI.list(),
      ])
      setCollections(collectionsData)
      setPresets(presetsData)
    } catch (err) {
      console.error('Error loading collections:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCollectionName.trim()) return

    try {
      await collectionsAPI.create({
        name: newCollectionName,
        item_type: 'leetcode',
      })
      setNewCollectionName('')
      setShowCreateForm(false)
      loadData()
    } catch (err) {
      console.error('Error creating collection:', err)
      alert('Failed to create collection')
    }
  }

  const handleImportPreset = async () => {
    if (!selectedPreset || !importCollectionId) return

    try {
      await presetsAPI.import(selectedPreset, importCollectionId)
      alert('Preset imported successfully!')
      setShowImportModal(false)
      setSelectedPreset('')
      setImportCollectionId('')
    } catch (err) {
      console.error('Error importing preset:', err)
      alert('Failed to import preset')
    }
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setSortBy('name_asc')
  }

  // Filter and sort collections
  const filteredCollections = useMemo(() => {
    let filtered = collections.filter(collection => {
      // Search filter
      if (searchQuery && !collection.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      return true
    })

    // Sort collections
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name)
        case 'name_desc':
          return b.name.localeCompare(a.name)
        case 'created_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        default:
          return 0
      }
    })
  }, [collections, searchQuery, sortBy])

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Collections</h1>
          <p className="text-gray-600 mt-1">
            Showing {filteredCollections.length} of {collections.length} collections
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Import Preset
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Create Collection
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="mb-6 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Collection</h3>
          <form onSubmit={handleCreateCollection} className="flex gap-4">
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Collection name"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Filters */}
      {collections.length > 0 && (
        <div className="bg-white shadow rounded-lg p-4 mb-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Filters</h3>
            {(searchQuery || sortBy !== 'name_asc') && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="created_desc">Newest First</option>
                <option value="created_asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Collections List */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCollections.map((collection) => (
          <div
            key={collection.id}
            onClick={() => navigate(`/collections/${collection.id}`)}
            className="bg-white shadow rounded-lg p-6 cursor-pointer hover:shadow-xl transition-shadow border border-gray-200 hover:border-primary-300"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {collection.name}
              </h3>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            {collection.description && (
              <p className="text-gray-600 text-sm mb-4">{collection.description}</p>
            )}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Type: {collection.item_type}
              </div>
              {collection.is_default && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                  Default
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {collections.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No collections yet. Create one to get started!</p>
        </div>
      )}

      {collections.length > 0 && filteredCollections.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-600 mb-4 mt-4">No collections match your filters.</p>
          <button
            onClick={handleClearFilters}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Import Preset List</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Preset
              </label>
              <select
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Choose a preset...</option>
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} ({preset.problem_count} problems)
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Import to Collection
              </label>
              <select
                value={importCollectionId}
                onChange={(e) => setImportCollectionId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Choose a collection...</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleImportPreset}
                disabled={!selectedPreset || !importCollectionId}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
