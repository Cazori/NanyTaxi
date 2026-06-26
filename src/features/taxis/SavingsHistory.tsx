import { useSavingsHistory } from '../../db/hooks'
import { Button } from '../../shared/ui/Button'
import { Modal } from '../../shared/ui/Modal'

interface Props {
  taxiPlate: string
  open: boolean
  onClose: () => void
}

const formatCurrency = (n: number) => `$${Math.abs(n).toLocaleString('es-CO')}`

export function SavingsHistoryModal({ taxiPlate, open, onClose }: Props) {
  const { entries } = useSavingsHistory(taxiPlate)

  const totalAdded = entries.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0)
  const totalRemoved = entries.filter((e) => e.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0)

  return (
    <Modal open={open} onCancel={onClose} title={`Historial de ahorro — ${taxiPlate}`} hideConfirm>
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-[var(--color-success-soft)] p-3 text-center">
            <p className="text-lg font-bold text-[var(--color-success)]">{formatCurrency(totalAdded)}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">Agregado</p>
          </div>
          <div className="rounded-xl bg-[var(--color-danger-soft)] p-3 text-center">
            <p className="text-lg font-bold text-[var(--color-danger)]">{formatCurrency(totalRemoved)}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">Retirado</p>
          </div>
        </div>

        {entries.length === 0 && (
          <p className="text-center text-[var(--color-text-muted)] py-4">No hay movimientos de ahorro.</p>
        )}

        {entries.map((e) => (
          <div key={e.id} className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{e.reason}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{e.date}</p>
            </div>
            <span className={`font-bold text-sm ml-2 ${e.amount > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
              {e.amount > 0 ? '+' : '-'}{formatCurrency(e.amount)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4"><Button fullWidth onClick={onClose}>Cerrar</Button></div>
    </Modal>
  )
}
