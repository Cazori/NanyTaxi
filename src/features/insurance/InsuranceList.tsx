import { useState } from 'react'
import { useInsurances, useTaxis } from '../../db/hooks'
import { Card } from '../../shared/ui/Card'
import { Button } from '../../shared/ui/Button'
import { Badge } from '../../shared/ui/Badge'
import { Modal } from '../../shared/ui/Modal'
import { useToast } from '../../shared/Toast'
import { InsuranceForm } from './InsuranceForm'
import type { Insurance, AlertLevel } from '../../types'

function getAlertLevel(days: number): AlertLevel {
  if (days <= 7) return 'critical'
  if (days <= 30) return 'warning'
  return 'ok'
}

const INSURANCE_LABELS: Record<string, string> = {
  SOAT: 'SOAT',
  Tecnomecánica: 'Tecnomecánica',
  'Tarjeta de Operaciones': 'Tarjeta de Operaciones',
  Impuestos: 'Impuestos',
  'Seguro Contractual': 'Seguro Contractual',
  'Seguro Extracontractual': 'Seguro Extracontractual',
}

export function InsuranceList() {
  const { insurances, addInsurance, updateInsurance, deleteInsurance, renewInsurance } = useInsurances()
  const { taxis } = useTaxis()
  const { toast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Insurance | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Insurance | null>(null)

  const today = new Date()
  const getDaysRemaining = (dateStr: string) => {
    const expiry = new Date(dateStr)
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  const activeInsurances = insurances.filter((i) => !i.renewed)

  const grouped = taxis.map((taxi) => {
    const taxiInsurances = activeInsurances
      .filter((ins) => ins.taxi_plate === taxi.plate)
      .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
    return { plate: taxi.plate, insurances: taxiInsurances }
  }).filter((g) => g.insurances.length > 0)

  const orphanInsurances = activeInsurances
    .filter((ins) => !taxis.find((t) => t.plate === ins.taxi_plate))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-0">Seguros</h1>
        <Button onClick={() => { setEditing(null); setShowForm(true) }}>+ Agregar</Button>
      </div>

      {grouped.length === 0 && orphanInsurances.length === 0 && (
        <Card className="animate-fade-in-up">
          <div className="text-center py-6">
            <p className="text-5xl mb-3">🔒</p>
            <p className="text-[var(--color-text-muted)] font-medium">No hay seguros registrados</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Agregá el SOAT, tecnomecánica y otros seguros</p>
          </div>
        </Card>
      )}

      {grouped.map((group) => (
        <div key={group.plate}>
          <h2 className="text-lg font-bold text-[var(--color-primary)] mb-2">{group.plate}</h2>
          <div className="space-y-2">
            {group.insurances.map((ins, i) => {
              const days = getDaysRemaining(ins.expiry_date)
              const level = getAlertLevel(days)
              return (
                <Card key={ins.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{INSURANCE_LABELS[ins.type] ?? ins.type}</span>
                        <Badge level={level}>
                          {days <= 0 ? `${Math.abs(days)} días vencido` : `${days} días`}
                        </Badge>
                      </div>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Vence: {new Date(ins.expiry_date).toLocaleDateString('es-CO')}
                      </p>
                      {ins.notes && <p className="text-xs text-[var(--color-text-muted)]">{ins.notes}</p>}
                    </div>
                    <div className="flex gap-1">
                      <button
                        className="text-sm text-[var(--color-primary)] font-bold px-3 py-2 min-h-[44px] rounded-xl hover:bg-[var(--color-accent-soft)] transition-colors"
                        onClick={() => {
                          const newIssue = new Date()
                          const newExpiry = new Date()
                          newExpiry.setFullYear(newExpiry.getFullYear() + 1)
                          renewInsurance(ins.id, newIssue.toISOString().slice(0, 10), newExpiry.toISOString().slice(0, 10))
                          toast('Seguro renovado')
                        }}
                      >🔄 Renovar</button>
                      <button
                        className="text-base text-[var(--color-primary)] font-bold px-3 py-2 min-h-[44px] rounded-xl hover:bg-[var(--color-accent-soft)] transition-colors"
                        onClick={() => { setEditing(ins); setShowForm(true) }}
                      >✏️</button>
                      <button
                        className="text-base text-[var(--color-danger)] font-bold px-3 py-2 min-h-[44px] rounded-xl hover:bg-[var(--color-danger-soft)] transition-colors"
                        onClick={() => setDeleteTarget(ins)}
                      >🗑️</button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      ))}

      {orphanInsurances.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text-muted)] mb-2">Sin taxi asignado</h2>
          <div className="space-y-2">
            {orphanInsurances.map((ins) => (
              <Card key={ins.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold">{INSURANCE_LABELS[ins.type]}</span>
                    <span className="text-[var(--color-text-muted)] ml-2">{ins.taxi_plate}</span>
                  </div>
                  <button
                    className="text-base text-[var(--color-danger)] font-bold px-4 py-3 min-h-[44px] rounded-xl hover:bg-[var(--color-danger-soft)] transition-colors"
                    onClick={() => setDeleteTarget(ins)}
                  >🗑️</button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <InsuranceForm
          initial={editing ?? undefined}
          onSave={async (data) => {
            if (editing) {
              await updateInsurance(editing.id, data as Partial<Insurance>)
              toast('Seguro actualizado')
            } else {
              try {
                await addInsurance(data)
                toast('Seguro agregado')
              } catch { toast('Error al agregar seguro', 'error') }
            }
            setShowForm(false); setEditing(null)
          }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      <Modal
        open={!!deleteTarget} title="Eliminar seguro"
        onConfirm={async () => {
          if (deleteTarget) {
            try {
              await deleteInsurance(deleteTarget.id)
              toast('Seguro eliminado', 'error')
            } catch { toast('Error al eliminar', 'error') }
            setDeleteTarget(null)
          }
        }}
        onCancel={() => setDeleteTarget(null)} confirmText="Eliminar" danger
      >
        ¿Eliminar este registro de seguro?
      </Modal>
    </div>
  )
}
