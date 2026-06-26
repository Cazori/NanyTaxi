import type { ReactNode } from 'react'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  title: string
  children: ReactNode
  onConfirm?: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  danger?: boolean
  hideConfirm?: boolean
}

export function Modal({
  open,
  title,
  children,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  danger = false,
}: ModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="rounded-2xl bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-card)] border border-[var(--color-border)] max-w-md w-full space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-[var(--color-text)]">{title}</h2>
        <div className="text-lg text-[var(--color-text-secondary)]">{children}</div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onCancel} fullWidth>
            {cancelText}
          </Button>
          {onConfirm && (
            <Button
              variant={danger ? 'danger' : 'primary'}
              onClick={onConfirm}
              fullWidth
            >
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
