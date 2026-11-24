import { Link } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import { itemsAPI } from '../../api/client'
import type { Collection, Item } from '../../types'
import Button from '../common/Button'
import Input from '../common/Input'
import Select from '../common/Select'

interface AddItemFormProps {
  collections: Collection[]
  hidden: boolean
  onCreated: (item: Item) => void
}

export default function AddItemForm({ collections, hidden, onCreated }: AddItemFormProps) {
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    const form = event.currentTarget
    const values = new FormData(form)
    const value = (name: string) => String(values.get(name) ?? '')
    const collectionId = value('collection')
    const title = value('title')

    if (!collectionId || !title.trim()) {
      alert('Please fill in required fields')
      return
    }

    setSubmitting(true)
    try {
      const item = await itemsAPI.create({
        collection_id: collectionId,
        title,
        external_url: value('url') || undefined,
        metadata: {
          difficulty: value('difficulty'),
          topics: value('topics').split(',').map(topic => topic.trim()).filter(Boolean),
          pattern: value('pattern') || undefined,
        },
        notes: value('notes') || undefined,
      })
      form.reset()
      onCreated(item)
    } catch (error) {
      console.error('Error creating item:', error)
      alert('Failed to create item')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div hidden={hidden} className="surface mb-6 p-5 sm:p-6">
      <h3 className="text-lg font-semibold mb-4">New problem</h3>
      {collections.length === 0 && (
        <p className="mb-4 text-gray-600">A problem belongs to a collection. <Link to="/collections?create=1" className="font-semibold text-primary-700 underline">Create a collection</Link> to continue.</p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select name="collection" label="Collection *" defaultValue={collections[0]?.id ?? ''} required>
          <option value="">Select a collection</option>
          {collections.map(collection => <option key={collection.id} value={collection.id}>{collection.name}</option>)}
        </Select>
        <Input name="title" label="Title *" placeholder="e.g., Two Sum" required />
        <Input name="url" label="LeetCode URL" type="url" placeholder="https://leetcode.com/problems/..." />
        <Select name="difficulty" label="Difficulty" defaultValue="Medium">
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </Select>
        <Input name="topics" label="Topics (comma-separated)" placeholder="Array, Hash Table, Two Pointers" />
        <Input name="pattern" label="Pattern" placeholder="e.g., Hash Map Lookup" />
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Personal Notes</span>
          <textarea
            name="notes"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
            placeholder="Your notes about this problem..."
          />
        </label>
        <Button type="submit" size="lg" fullWidth disabled={submitting || collections.length === 0}>
          {submitting ? 'Adding…' : 'Add Problem'}
        </Button>
      </form>
    </div>
  )
}
