import { useState } from 'react'
import { useTaxis } from '../../db/hooks'
import { Card } from '../../shared/ui/Card'
import { Button } from '../../shared/ui/Button'
import { Modal } from '../../shared/ui/Modal'
import { useToast } from '../../shared/Toast'
import { TaxiForm } from './TaxiForm'
import { SavingsHistoryModal } from './SavingsHistory'
import type { Taxi } from '../../types'

interface Props {
  onTaxiSelect: (plate: string) => void
}

export function TaxiList({ onTaxiSelect }: Props) {
  const { taxis, addTaxi, updateTaxi, deleteTaxi } = useTaxis()
  const { toast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Taxi | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Taxi | null>(null)
  const [savingsPlate, setSavingsPlate] = useState<string | null>(null)

  const formatCurrency = (n: number) => `$${n.toLocaleString('es-CO')}`

  const handleSave = (data: Omit<Taxi, 'id' | 'created_at' | 'accumulated_savings'>) => {
    if (editing) {
      updateTaxi(editing.id, data)
      toast('Taxi actualizado')
    } else {
      addTaxi(data)
      toast('Taxi agregado')
    }
    setShowForm(false)
    setEditing(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-0">Taxis</h1>
        <Button onClick={() => { setEditing(null); setShowForm(true) }}>
          + Agregar
        </Button>
      </div>

      {taxis.length === 0 && !showForm && (
        <Card className="animate-fade-in-up">
          <div className="text-center py-6">
            <p className="text-5xl mb-3">🚕</p>
            <p className="text-[var(--color-text-muted)] font-medium">No hay taxis registrados</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Agregá el primer taxi para empezar</p>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {taxis.map((taxi, i) => (
          <Card
            key={taxi.id}
            className="animate-fade-in-up cursor-pointer active:scale-[0.98] transition-transform"
            style={{ animationDelay: `${i * 50}ms` }}
            onClick={() => onTaxiSelect(taxi.plate)}
          >
            <div className="flex items-start gap-4">
              {/* Icono grande */}
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent-soft)] flex items-center justify-center text-3xl shrink-0">
                🚕
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-[var(--color-text)]">{taxi.plate}</h3>
                <p className="text-base text-[var(--color-text-secondary)] font-medium">
                  🧑‍✈️ {taxi.driver_name}
                </p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Descansa {taxi.rest_day}
                </p>
                <div className="flex gap-4 mt-1 text-sm">
                  <span className="bg-[var(--color-accent-soft)] rounded-lg px-3 py-1 font-bold text-[var(--color-primary)]">
                    {formatCurrency(taxi.daily_fee)}
                  </span>
                  <span className="bg-[var(--color-success-soft)] rounded-lg px-3 py-1 font-bold text-[var(--color-success)]">
                    +{formatCurrency(taxi.daily_savings)}
                  </span>
                </div>
                <button
                  className="text-[var(--color-success)] font-bold text-sm mt-2 hover:underline flex items-center gap-1"
                  onClick={(e) => { e.stopPropagation(); setSavingsPlate(taxi.plate) }}
                >
                  🏦 Ahorro: {formatCurrency(taxi.accumulated_savings)}
                </button>
              </div>

              {/* Acciones */}
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  className="text-base text-[var(--color-text-muted)] hover:text-[var(--color-primary)] px-3 py-3 min-h-[44px] rounded-xl hover:bg-[var(--color-accent-soft)] transition-colors"
                  onClick={(e) => { e.stopPropagation(); setEditing(taxi); setShowForm(true) }}
                  aria-label="Editar taxi"
                >
                  ✏️
                </button>
                <button
                  className="text-base text-[var(--color-text-muted)] hover:text-[var(--color-danger)] px-3 py-3 min-h-[44px] rounded-xl hover:bg-[var(--color-danger-soft)] transition-colors"
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(taxi) }}
                  aria-label="Eliminar taxi"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Hint para tocar */}
            <p className="text-xs text-[var(--color-text-muted)] text-center mt-3 pt-2 border-t border-[var(--color-border)]">
              Tocá para ver calendario y pagos →
            </p>
          </Card>
        ))}
      </div>

      {showForm && (
        <TaxiForm
          initial={editing ?? undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {savingsPlate && (
        <SavingsHistoryModal
          taxiPlate={savingsPlate}
          open={!!savingsPlate}
          onClose={() => setSavingsPlate(null)}
        />
      )}

      <Modal
        open={!!deleteTarget}
        title="Eliminar taxi"
        onConfirm={() => {
          if (deleteTarget) {
            deleteTaxi(deleteTarget.id)
              .then(() => toast('Taxi eliminado', 'error'))
              .catch(() => toast('Error al eliminar', 'error'))
          }
          setDeleteTarget(null)
        }}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Eliminar"
        danger
      >
        ¿Eliminar taxi <strong>{deleteTarget?.plate}</strong> y todos sus datos?
      </Modal>
    </div>
  )
}
