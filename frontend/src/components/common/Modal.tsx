import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
}

const widthClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' }

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen && !dialog.open) dialog.showModal()
    if (!isOpen && dialog.open) dialog.close()
  }, [isOpen])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className={`surface modal-panel ${widthClasses[maxWidth]}`}
      onCancel={event => { event.preventDefault(); onClose() }}
      onClick={event => {
        if (event.target !== event.currentTarget) return
        const { top, right, bottom, left } = event.currentTarget.getBoundingClientRect()
        if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) onClose()
      }}
    >
      <div className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="icon-link" onClick={onClose} aria-label="Close dialog"><X size={17} aria-hidden="true" /></button>
      </div>
      {isOpen && children}
    </dialog>
  )
}
