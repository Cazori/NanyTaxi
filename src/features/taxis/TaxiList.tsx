import { useState } from 'react'
import { useTaxis } from '../../db/hooks'
import { Card } from '../../shared/ui/Card'
import { Button } from '../../shared/ui/Button'
import { Modal } from '../../shared/ui/Modal'
import { useToast } from '../../shared/Toast'
import { TaxiForm } from './TaxiForm'
import { SavingsHistoryModal } from './SavingsHistory'
import type { Taxi } from '../../types'

export function TaxiList() {
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
          <Card key={taxi.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold">{taxi.plate}</h3>
                <p className="text-[var(--color-text-secondary)] text-base font-medium">
                  🧑‍✈️ {taxi.driver_name}
                </p>
                <p className="text-[var(--color-text-muted)] text-xs">
                  Descansa: {taxi.rest_day}
                </p>
                <div className="flex gap-4 mt-1 text-sm">
                  <span className="text-[var(--color-text-secondary)]">
                    Cuota: <strong>{formatCurrency(taxi.daily_fee)}</strong>
                  </span>
                  <span className="text-[var(--color-text-muted)]">
                    Ahorro/día: <strong>{formatCurrency(taxi.daily_savings)}</strong>
                  </span>
                </div>
                <button
                  className="text-[var(--color-success)] font-bold text-sm mt-1 hover:underline"
                  onClick={() => setSavingsPlate(taxi.plate)}
                >
                  🏦 Ahorro total: {formatCurrency(taxi.accumulated_savings)}
                </button>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  className="text-base text-[var(--color-primary)] font-bold px-4 py-3 min-h-[44px] rounded-xl hover:bg-[var(--color-accent-soft)] transition-colors"
                  onClick={() => { setEditing(taxi); setShowForm(true) }}
                >
                  ✏️
                </button>
                <button
                  className="text-base text-[var(--color-danger)] font-bold px-4 py-3 min-h-[44px] rounded-xl hover:bg-[var(--color-danger-soft)] transition-colors"
                  onClick={() => setDeleteTarget(taxi)}
                >
                  🗑️
                </button>
              </div>
            </div>
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
