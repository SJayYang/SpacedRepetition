import { useEffect, useState } from 'react'
import { ArrowDownToLine, ChevronRight, FolderClosed, Plus } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { collectionsAPI, presetsAPI } from '../api/client'
import { Collection, Preset } from '../types'
import Modal from '../components/common/Modal'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Button from '../components/common/Button'
import GridList from '../components/common/GridList'
import PageHeader from '../components/common/PageHeader'

export default function Collections() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [collections, setCollections] = useState<Collection[]>([])
  const [presets, setPresets] = useState<Preset[]>([])
  const [loading, setLoading] = useState(true)
  const importRequested = searchParams.has('import')
  const showCreateForm = searchParams.has('create')
  const showImportModal = importRequested && !showCreateForm
  const setPanel = (panel: 'import' | 'create' | 'create-and-import' | null) => {
    const next = new URLSearchParams(searchParams)
    next.delete('create')
    next.delete('import')
    if (panel === 'create' || panel === 'create-and-import') next.set('create', '1')
    if (panel === 'import' || panel === 'create-and-import') next.set('import', '1')
    setSearchParams(next, { replace: true })
  }
  const [newCollectionName, setNewCollectionName] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [importCollectionId, setImportCollectionId] = useState<string>('')


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
      const newCollection = await collectionsAPI.create({
        name: newCollectionName,
        item_type: 'leetcode',
      })
      // Optimistically add to collections list
      setCollections(current => [...current, newCollection])
      if (importRequested) setImportCollectionId(newCollection.id)
      setNewCollectionName('')
      setPanel(importRequested ? 'import' : null)
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
      setPanel(null)
      setSelectedPreset('')
      setImportCollectionId('')
    } catch (err) {
      console.error('Error importing preset:', err)
      alert('Failed to import preset')
    }
  }


  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div>
      <PageHeader
        title="Collections"
        subtitle={`${collections.length} ${collections.length === 1 ? 'collection' : 'collections'}`}
        actions={
          <>
            <button type="button" className="ui-button ui-button-secondary" onClick={() => setPanel('import')}>
              <ArrowDownToLine size={16} aria-hidden="true" /> Import preset
            </button>
            <button type="button" className="ui-button ui-button-primary" onClick={() => setPanel('create')}>
              <Plus size={17} aria-hidden="true" /> New collection
            </button>
          </>
        }
      />

      {/* Create Form */}
      {showCreateForm && (
        <div className="surface mb-6 p-5 sm:p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Collection</h3>
          <form onSubmit={handleCreateCollection} className="flex flex-wrap items-end gap-2 sm:flex-nowrap">
            <Input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              label="Collection name"
              placeholder="e.g., Interview prep"
              className="flex-1"
            />
            <Button type="submit" variant="primary">
              Create
            </Button>
            <Button type="button" variant="secondary" onClick={() => setPanel(importRequested ? 'import' : null)}>
              Cancel
            </Button>
          </form>
        </div>
      )}


      {/* Collections List */}
      <GridList columns={3}>
        {collections.map((collection) => (
          <Link key={collection.id} to={`/collections/${collection.id}`} className="surface collection-tile">
            <span className="collection-tile-icon"><FolderClosed size={19} aria-hidden="true" /></span>
            <span className="collection-tile-content">
              <strong>{collection.name}</strong>
              {collection.description && <span>{collection.description}</span>}
              <span>{collection.item_type === 'leetcode' ? 'LeetCode' : collection.item_type}{collection.is_default && ' · Default'}</span>
            </span>
            <ChevronRight size={17} aria-hidden="true" />
          </Link>
        ))}
      </GridList>

      {collections.length === 0 && (
        <div className="surface empty-panel">
          <FolderClosed size={25} aria-hidden="true" />
          <h2>No collections yet</h2>
          <p>Create a collection to group problems or import a preset.</p>
        </div>
      )}


      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setPanel(null)}
        title="Import Preset List"
      >
        <div className="space-y-4">
          <Select
            label="Select Preset"
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
          >
            <option value="">Choose a preset...</option>
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name} ({preset.problem_count} problems)
              </option>
            ))}
          </Select>

          <Select
            label="Import to Collection"
            value={importCollectionId}
            onChange={(e) => setImportCollectionId(e.target.value)}
          >
            <option value="">Choose a collection...</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </Select>

          {collections.length === 0 && (
            <p className="text-gray-600">You’ll need a collection to import into. <button type="button" className="font-semibold text-primary-700 underline" onClick={() => setPanel('create-and-import')}>Create a collection</button></p>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => setPanel(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleImportPreset}
              disabled={!selectedPreset || !importCollectionId}
            >
              Import
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
