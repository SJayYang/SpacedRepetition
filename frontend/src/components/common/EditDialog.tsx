import { useState, useEffect } from 'react'
import Button from './Button'
import Card from './Card'

interface EditDialogProps {
  isOpen: boolean
  title: string
  label: string
  initialValue: string
  placeholder?: string
  onSave: (value: string) => void
  onCancel: () => void
}

export default function EditDialog({
  isOpen,
  title,
  label,
  initialValue,
  placeholder,
  onSave,
  onCancel,
}: EditDialogProps) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) {
      onSave(value.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {label}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!value.trim()}>
              Save
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
