import { Collection } from '../../types'
import Card from '../common/Card'
import Button from '../common/Button'

interface CollectionSelectorProps {
  collections: Collection[]
  onSelect: (collectionId: string | null) => void
  onCancel: () => void
}

export default function CollectionSelector({ collections, onSelect, onCancel }: CollectionSelectorProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Card padding="lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Choose a Collection to Review
        </h2>
        <p className="text-gray-600 mb-6">
          Select which collection you'd like to review, or choose "All Collections" to review items from everywhere.
        </p>

        <div className="space-y-3">
          {/* All Collections Option */}
          <button
            onClick={() => onSelect(null)}
            className="w-full p-4 text-left border-2 border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">All Collections</h3>
                <p className="text-sm text-gray-600">Review items from all your collections</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Individual Collections */}
          {collections.map((collection) => (
            <button
              key={collection.id}
              onClick={() => onSelect(collection.id)}
              className="w-full p-4 text-left border-2 border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{collection.name}</h3>
                  {collection.description && (
                    <p className="text-sm text-gray-600">{collection.description}</p>
                  )}
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6">
          <Button variant="secondary" fullWidth onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  )
}
