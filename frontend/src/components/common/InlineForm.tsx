import { ReactNode, FormEvent } from 'react'
import Button from './Button'

interface InlineFormProps {
  title: string
  onSubmit: (e: FormEvent) => void
  onCancel: () => void
  children: ReactNode
  submitLabel?: string
  cancelLabel?: string
}

export default function InlineForm({
  title,
  onSubmit,
  onCancel,
  children,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
}: InlineFormProps) {
  return (
    <div className="mb-6 bg-white shadow rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        {children}
        <div className="flex gap-2">
          <Button type="submit" variant="primary">
            {submitLabel}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </form>
    </div>
  )
}
