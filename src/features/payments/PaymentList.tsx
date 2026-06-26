import { useState, useEffect } from 'react'
import { usePayments, useTaxis } from '../../db/hooks'
import { Card } from '../../shared/ui/Card'
import { Button } from '../../shared/ui/Button'
import { Modal } from '../../shared/ui/Modal'
import { useToast } from '../../shared/Toast'
import { PaymentForm } from './PaymentForm'
import { PaymentCalendar } from './PaymentCalendar'
import type { DayCoverage, Payment } from '../../types'

export function PaymentList() {
  const { taxis } = useTaxis()
  const { toast } = useToast()
  const [selectedPlate, setSelectedPlate] = useState<string | undefined>()
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const { payments, getCoverageForMonth, getMonthlySummary, deletePayment } = usePayments(selectedPlate, selectedMonth)
  const [showForm, setShowForm] = useState(false)
  const [editPayment, setEditPayment] = useState<Payment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null)
  const [coverage, setCoverage] = useState<DayCoverage[]>([])
  const [summary, setSummary] = useState<{ paidDays: number; totalAmount: number; totalDays: number; overdueDays: number; restDays: number } | null>(null)
  const [loadingCoverage, setLoadingCoverage] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const selectedTaxi = taxis.find((t) => t.plate === selectedPlate)
  const formatCurrency = (n: number) => `$${n.toLocaleString('es-CO')}`

  useEffect(() => {
    if (!selectedPlate || !selectedMonth) { setCoverage([]); setSummary(null); return }
    setLoadingCoverage(true)
    Promise.all([
      getCoverageForMonth(selectedPlate, selectedMonth),
      getMonthlySummary(selectedPlate, selectedMonth),
    ]).then(([c, s]) => { setCoverage(c); setSummary(s) })
      .finally(() => setLoadingCoverage(false))
  }, [selectedPlate, selectedMonth, getCoverageForMonth, getMonthlySummary, refreshKey])

  const refreshCoverage = () => setRefreshKey((k) => k + 1)

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try { await deletePayment(deleteTarget.id); toast('Pago eliminado', 'error'); setDeleteTarget(null); refreshCoverage() }
    catch { toast('Error al eliminar', 'error') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-0">Pagos</h1>
        {selectedPlate && <Button onClick={() => setShowForm(true)}>+ Registrar</Button>}
      </div>

      {/* Filters */}
      <Card className="animate-fade-in-up">
        <div className="flex gap-2">
          <select
            className="flex-1 w-full rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface-card)] text-[var(--color-text)] px-3 py-3 text-base focus:border-[var(--color-border-focus)] focus:outline-none"
            value={selectedPlate ?? ''}
            onChange={(e) => setSelectedPlate(e.target.value || undefined)}
          >
            <option value="">Seleccionar taxi</option>
            {taxis.map((t) => (
              <option key={t.plate} value={t.plate}>{t.plate} — {t.driver_name}</option>
            ))}
          </select>
          <input
            type="month"
            className="w-40 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface-card)] text-[var(--color-text)] px-3 py-3 text-base focus:border-[var(--color-border-focus)] focus:outline-none"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>
      </Card>

      {/* Calendar */}
      {selectedPlate && loadingCoverage && (
        <Card><p className="text-center text-[var(--color-text-muted)] py-4">Cargando...</p></Card>
      )}
      {selectedPlate && !loadingCoverage && coverage.length > 0 && selectedTaxi && (
        <PaymentCalendar
          coverage={coverage}
          yearMonth={selectedMonth}
          dailyFee={selectedTaxi.daily_fee}
          dailySavings={selectedTaxi.daily_savings}
        />
      )}

      {!selectedPlate && (
        <Card className="animate-fade-in-up">
          <div className="text-center py-6">
            <p className="text-5xl mb-3">👆</p>
            <p className="text-[var(--color-text-muted)] font-medium">Seleccioná un taxi</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Después elegí el mes para ver el calendario</p>
          </div>
        </Card>
      )}

      {selectedPlate && payments.length === 0 && (
        <Card className="animate-fade-in-up">
          <div className="text-center py-6">
            <p className="text-5xl mb-3">💸</p>
            <p className="text-[var(--color-text-muted)] font-medium">No hay pagos registrados</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Registrá el primer pago</p>
          </div>
        </Card>
      )}

      {/* Summary */}
      {summary && selectedPlate && selectedTaxi && (
        <Card className="animate-fade-in-up">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text)]">{selectedTaxi.driver_name}</h2>
              <p className="text-xs text-[var(--color-text-muted)] capitalize">
                {new Date(selectedMonth + '-01').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <span className="text-2xl">📊</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="rounded-xl bg-[var(--color-success-soft)] p-3 text-center">
              <p className="text-2xl font-bold text-[var(--color-success)]">{summary.paidDays}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Pagados</p>
            </div>
            <div className="rounded-xl bg-[var(--color-danger-soft)] p-3 text-center">
              <p className="text-2xl font-bold text-[var(--color-danger)]">{summary.overdueDays}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Vencidos</p>
            </div>
          </div>
          <div className="flex justify-between mt-3 pt-3 border-t border-[var(--color-border)] text-sm">
            <span className="text-[var(--color-text-secondary)]">Días hábiles: <strong>{summary.totalDays}</strong></span>
            <span>Total pagado: <strong>{formatCurrency(summary.totalAmount)}</strong></span>
          </div>
        </Card>
      )}

      {/* Payment list */}
      <div className="space-y-2">
        {payments.map((p, i) => {
          const taxi = taxis.find((t) => t.plate === p.taxi_plate)
          const daysCovered = p.covered_days?.length ?? 1
          return (
            <Card key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-lg">{taxi?.driver_name ?? p.taxi_plate}</p>
                    <span className="text-xs text-[var(--color-text-muted)]">{p.taxi_plate}</span>
                    {daysCovered > 1 && (
                      <span className="text-xs bg-[var(--color-accent-soft)] text-[var(--color-primary)] rounded-full px-2 py-0.5 font-bold">
                        {daysCovered} días
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">{p.date}</p>
                  {p.covered_days && p.covered_days.length > 0 && (
                    <p className="text-xs text-[var(--color-text-muted)] truncate">
                      Cubre: {p.covered_days[0]} → {p.covered_days[p.covered_days.length - 1]}
                    </p>
                  )}
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className="font-bold text-lg text-[var(--color-success)]">{formatCurrency(p.amount)}</p>
                  <span className="bg-[var(--color-success)] text-white inline-flex items-center rounded-full px-3 py-1 text-xs font-bold">Pagado</span>
                  <div className="flex gap-1 mt-1">
                    <button className="text-xs text-[var(--color-primary)] font-bold px-3 py-2 min-h-[36px] rounded-lg hover:bg-[var(--color-accent-soft)] transition-colors"
                      onClick={() => setEditPayment(p)}>✏️</button>
                    <button className="text-xs text-[var(--color-danger)] font-bold px-3 py-2 min-h-[36px] rounded-lg hover:bg-[var(--color-danger-soft)] transition-colors"
                      onClick={() => setDeleteTarget(p)}>🗑️</button>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {showForm && (
        <PaymentForm
          onSave={() => { setShowForm(false); toast('Pago registrado'); refreshCoverage() }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editPayment && (
        <PaymentForm
          editData={{ paymentId: editPayment.id, taxiPlate: editPayment.taxi_plate, amount: editPayment.amount, date: editPayment.date }}
          onSave={() => { setEditPayment(null); toast('Pago actualizado'); refreshCoverage() }}
          onCancel={() => setEditPayment(null)}
        />
      )}

      <Modal open={!!deleteTarget} title="Eliminar pago"
        onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)}
        confirmText="Eliminar" danger>
        ¿Eliminar pago de <strong>{deleteTarget ? formatCurrency(deleteTarget.amount) : ''}</strong>?
      </Modal>
    </div>
  )
}
