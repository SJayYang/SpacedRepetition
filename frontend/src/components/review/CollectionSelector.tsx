import { ChevronRight, FolderClosed, Layers2 } from 'lucide-react'
import type { Collection } from '../../types'
import PageHeader from '../common/PageHeader'

interface CollectionSelectorProps {
  collections: Collection[]
  onSelect: (collectionId: string | null) => void
  onCancel: () => void
}

export default function CollectionSelector({ collections, onSelect, onCancel }: CollectionSelectorProps) {
  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Start a review"
        subtitle="Choose which collection to review."
        actions={<button type="button" className="ui-button ui-button-secondary" onClick={onCancel}>Cancel</button>}
      />
      <div className="surface review-collections">
        <button type="button" className="collection-tile" onClick={() => onSelect(null)}>
          <span className="collection-tile-icon"><Layers2 size={18} aria-hidden="true" /></span>
          <span className="collection-tile-content"><strong>All collections</strong><span>Review any due problem in your library</span></span>
          <ChevronRight size={17} aria-hidden="true" />
        </button>
        {collections.map(collection => (
          <button key={collection.id} type="button" className="collection-tile" onClick={() => onSelect(collection.id)}>
            <span className="collection-tile-icon"><FolderClosed size={18} aria-hidden="true" /></span>
            <span className="collection-tile-content">
              <strong>{collection.name}</strong>
              {collection.description && <span>{collection.description}</span>}
            </span>
            <ChevronRight size={17} aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  )
}
