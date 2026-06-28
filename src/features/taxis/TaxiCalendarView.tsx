import { useState, useEffect, useCallback } from 'react'
import { usePayments, useTaxis, useUnavailability, useManualCoverage } from '../../db/hooks'
import { Card } from '../../shared/ui/Card'
import { Button } from '../../shared/ui/Button'
import { Modal } from '../../shared/ui/Modal'
import { useToast } from '../../shared/Toast'
import { PaymentForm } from '../payments/PaymentForm'
import { PaymentCalendar } from '../payments/PaymentCalendar'
import type { DayCoverage, Payment } from '../../types'

interface Props {
  plate: string
  onBack: () => void
}

export function TaxiCalendarView({ plate, onBack }: Props) {
  const { taxis } = useTaxis()
  const { toast } = useToast()
  const { addUnavailability, removeUnavailability } = useUnavailability()
  const { addManualCoverage, removeManualCoverage } = useManualCoverage()
  const MIN_MONTH = '2026-06'
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [refreshKey, setRefreshKey] = useState(0)
  const { payments, getCoverageForMonth, getMonthlySummary, deletePayment } = usePayments(plate, selectedMonth, refreshKey)
  const [showForm, setShowForm] = useState(false)
  const [editPayment, setEditPayment] = useState<Payment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null)
  const [coverage, setCoverage] = useState<DayCoverage[]>([])
  const [summary, setSummary] = useState<{ paidDays: number; totalAmount: number; totalDays: number; overdueDays: number; restDays: number; unavailabilityDays: number } | null>(null)
  const [loadingCoverage, setLoadingCoverage] = useState(false)
  const [unavailTarget, setUnavailTarget] = useState<{ date: string; status: DayCoverage['status']; manuallyCovered?: boolean } | null>(null)

  const taxi = taxis.find((t) => t.plate === plate)
  const formatCurrency = (n: number) => `$${n.toLocaleString('es-CO')}`

  const refreshAll = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  useEffect(() => {
    if (!selectedMonth) { setCoverage([]); setSummary(null); return }
    let cancelled = false
    setLoadingCoverage(true)
    Promise.all([
      getCoverageForMonth(plate, selectedMonth),
      getMonthlySummary(plate, selectedMonth),
    ]).then(([c, s]) => {
      if (cancelled) return
      setCoverage(c); setSummary(s)
    }).finally(() => { if (!cancelled) setLoadingCoverage(false) })
    return () => { cancelled = true }
  }, [plate, selectedMonth, getCoverageForMonth, getMonthlySummary, refreshKey])

  const handleFormSaved = () => {
    setShowForm(false)
    toast('Pago registrado')
    refreshAll()
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deletePayment(deleteTarget.id)
      toast('Pago eliminado', 'error')
      setDeleteTarget(null)
      refreshAll()
    } catch { toast('Error al eliminar', 'error') }
  }

  const handlePrevMonth = () => {
    setLoadingCoverage(true)
    const d = new Date(selectedMonth + '-01')
    d.setMonth(d.getMonth() - 1)
    const newMonth = d.toISOString().slice(0, 7)
    if (newMonth >= MIN_MONTH) setSelectedMonth(newMonth)
  }

  const handleNextMonth = () => {
    setLoadingCoverage(true)
    const d = new Date(selectedMonth + '-01')
    d.setMonth(d.getMonth() + 1)
    setSelectedMonth(d.toISOString().slice(0, 7))
  }

  const monthLabel = new Date(selectedMonth + '-01').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

  // ── Unavailability handlers ──

  const handleDayClick = (date: string, status: DayCoverage['status'], manuallyCovered?: boolean) => {
    setUnavailTarget({ date, status, manuallyCovered })
  }

  const handleAddUnavailability = async (reason: string) => {
    if (!unavailTarget) return
    try {
      await addUnavailability(plate, unavailTarget.date, reason)
      toast(`Día marcado como ${reason.toLowerCase()}`)
      setUnavailTarget(null)
      refreshAll()
    } catch { toast('Error al guardar', 'error') }
  }

  const handleRemoveUnavailability = async () => {
    if (!unavailTarget) return
    try {
      await removeUnavailability(plate, unavailTarget.date)
      toast('Novedad eliminada')
      setUnavailTarget(null)
      refreshAll()
    } catch { toast('Error al eliminar', 'error') }
  }

  const isUnavail = coverage.find((d) => d.date === unavailTarget?.date)?.status === 'unavailability'
  const isManuallyCovered = !!unavailTarget?.manuallyCovered
  const isAutoPaid = unavailTarget?.status === 'paid' && !unavailTarget?.manuallyCovered

  const handleAddManualCoverage = async () => {
    if (!unavailTarget) return
    try {
      await addManualCoverage(plate, unavailTarget.date)
      toast('Día marcado como pagado manualmente ✅')
      setUnavailTarget(null)
      refreshAll()
    } catch { toast('Error al marcar', 'error') }
  }

  const handleRemoveManualCoverage = async () => {
    if (!unavailTarget) return
    try {
      await removeManualCoverage(plate, unavailTarget.date)
      toast('Marca manual eliminada')
      setUnavailTarget(null)
      refreshAll()
    } catch { toast('Error al eliminar', 'error') }
  }

  if (!taxi) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="text-[var(--color-primary)] font-bold text-base flex items-center gap-2 min-h-[44px]">
          ← Volver
        </button>
        <Card><p className="text-center text-[var(--color-text-muted)] py-6">Taxi no encontrado</p></Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Back button + taxi header */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-lg font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-soft)] transition-colors shrink-0"
          aria-label="Volver"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-[var(--color-text)] truncate">{taxi.plate}</h2>
          <p className="text-xs text-[var(--color-text-secondary)] truncate">🧑‍✈️ {taxi.driver_name} · {taxi.rest_day}</p>
        </div>
        <button
          onClick={() => toast(`Cuota: ${formatCurrency(taxi.daily_fee)} · Ahorro: ${formatCurrency(taxi.daily_savings)} · Acumulado: ${formatCurrency(taxi.accumulated_savings)}`)}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-base hover:bg-[var(--color-accent-soft)] transition-colors shrink-0"
          aria-label="Ver ahorro"
        >
          🏦
        </button>
      </div>

      {/* Calendar */}
      {loadingCoverage && (
        <Card><p className="text-center text-[var(--color-text-muted)] py-4">Cargando...</p></Card>
      )}
      {!loadingCoverage && coverage.length > 0 && (
        <PaymentCalendar
          coverage={coverage}
          yearMonth={selectedMonth}
          dailyFee={taxi.daily_fee}
          dailySavings={taxi.daily_savings}
          onDayClick={handleDayClick}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          canGoPrev={selectedMonth > MIN_MONTH}
        />
      )}

      {/* Summary */}
      {summary && (
        <Card className="animate-fade-in-up">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-bold text-[var(--color-text)]">{taxi.driver_name}</p>
              <p className="text-xs text-[var(--color-text-muted)] capitalize">{monthLabel}</p>
            </div>
            <span className="text-2xl">📊</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="rounded-xl bg-[var(--color-success-soft)] p-3 text-center">
              <p className="text-2xl font-bold text-[var(--color-success)]">{summary.paidDays}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Pagados</p>
            </div>
            <div className="rounded-xl bg-[var(--color-danger-soft)] p-3 text-center">
              <p className="text-2xl font-bold text-[var(--color-danger)]">{summary.overdueDays}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Vencidos</p>
            </div>
            {summary.unavailabilityDays > 0 && (
              <div className="rounded-xl bg-yellow-100 dark:bg-yellow-900/30 p-3 text-center">
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{summary.unavailabilityDays}</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">Taller/Inc.</p>
              </div>
            )}
          </div>
          <div className="flex justify-between mt-3 pt-3 border-t border-[var(--color-border)] text-sm">
            <span className="text-[var(--color-text-secondary)]">
              Días hábiles: <strong>{summary.totalDays}</strong>
            </span>
            <span>Total pagado: <strong>{formatCurrency(summary.totalAmount)}</strong></span>
          </div>
        </Card>
      )}

      {/* Payment list */}
      {payments.length === 0 && (
        <Card className="animate-fade-in-up">
          <div className="text-center py-6">
            <p className="text-5xl mb-3">💸</p>
            <p className="text-[var(--color-text-muted)] font-medium">No hay pagos este mes</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Registrá el primer pago</p>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {payments.map((p, i) => {
          const daysCovered = p.covered_days?.length ?? 1
          return (
            <Card key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-lg">{taxi.driver_name}</p>
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
                  <div className="flex gap-2 mt-2">
                    <button className="flex-1 bg-[var(--color-accent-soft)] text-[var(--color-primary)] font-bold rounded-xl px-4 py-3 min-h-[48px] text-sm hover:brightness-95 transition-all active:scale-95"
                      onClick={() => setEditPayment(p)}>✏️ Editar</button>
                    <button className="flex-1 bg-[var(--color-danger-soft)] text-[var(--color-danger)] font-bold rounded-xl px-4 py-3 min-h-[48px] text-sm hover:brightness-95 transition-all active:scale-95"
                      onClick={() => setDeleteTarget(p)}>🗑️ Eliminar</button>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Payment form */}
      {showForm && (
        <PaymentForm
          defaultPlate={plate}
          onSave={handleFormSaved}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editPayment && (
        <PaymentForm
          editData={{ paymentId: editPayment.id, taxiPlate: editPayment.taxi_plate, amount: editPayment.amount, date: editPayment.date }}
          onSave={() => { setEditPayment(null); toast('Pago actualizado'); refreshAll() }}
          onCancel={() => setEditPayment(null)}
        />
      )}

      <Modal open={!!deleteTarget} title="Eliminar pago"
        onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)}
        confirmText="Eliminar" danger>
        ¿Eliminar pago de <strong>{deleteTarget ? formatCurrency(deleteTarget.amount) : ''}</strong>?
      </Modal>

      {/* Bottom sheet — acciones del día */}
      {unavailTarget && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setUnavailTarget(null)}>
          <div className="fixed inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-md mx-auto bg-[var(--color-surface-card)] rounded-t-3xl p-6 pt-5 shadow-2xl border-t border-[var(--color-border)] space-y-4 z-10 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-[var(--color-text)]">
                  {new Date(unavailTarget.date).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <p className="text-sm text-[var(--color-text-muted)] capitalize">
                  {isManuallyCovered ? '✅ Pagado (manual)' :
                   isAutoPaid ? '✅ Pagado (automático)' :
                   unavailTarget.status === 'overdue' ? '🔴 Vencido' :
                   unavailTarget.status === 'future' ? '⬜ Futuro' :
                   unavailTarget.status === 'unavailability' ? `⚠ ${coverage.find(d => d.date === unavailTarget.date)?.unavailabilityReason ?? 'Novedad'}` : ''}
                </p>
              </div>
              <button
                onClick={() => setUnavailTarget(null)}
                className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-[var(--color-accent-soft)] text-xl"
              >✕</button>
            </div>

            <div className="space-y-3">
              {isAutoPaid ? (
                <>
                  <p className="text-center text-[var(--color-text-secondary)] text-sm pb-2">
                    ✅ Día pagado. Podés agregar una novedad si el taxi no trabajó:
                  </p>
                  <Button fullWidth onClick={() => handleAddUnavailability('Taller')} className="py-4 min-h-[56px]">
                    🔧 Taller mecánico
                  </Button>
                  <Button fullWidth onClick={() => handleAddUnavailability('Incapacidad')} className="py-4 min-h-[56px]">
                    🏥 Incapacidad
                  </Button>
                  <Button fullWidth onClick={() => handleAddUnavailability('Feriado')} className="py-4 min-h-[56px]">
                    🎉 Feriado
                  </Button>
                  <Button fullWidth onClick={() => handleAddUnavailability('Otro')} className="py-4 min-h-[56px]">
                    📝 Otro motivo
                  </Button>
                </>
              ) : isManuallyCovered ? (
                <Button fullWidth variant="danger" onClick={handleRemoveManualCoverage}>
                  ❌ Quitar marca manual
                </Button>
              ) : !isUnavail ? (
                <>
                  {(unavailTarget?.status === 'overdue' || unavailTarget?.status === 'future') && (
                    <>
                      <Button fullWidth variant="success" onClick={handleAddManualCoverage} className="text-xl py-4 min-h-[60px]">
                        ✅ Marcar como pagado
                      </Button>
                      <div className="border-t border-[var(--color-border)] pt-2">
                        <p className="text-sm text-[var(--color-text-muted)] text-center mb-3">O marcar una novedad:</p>
                      </div>
                    </>
                  )}
                  <Button fullWidth onClick={() => handleAddUnavailability('Taller')} className="py-4 min-h-[56px]">
                    🔧 Taller mecánico
                  </Button>
                  <Button fullWidth onClick={() => handleAddUnavailability('Incapacidad')} className="py-4 min-h-[56px]">
                    🏥 Incapacidad
                  </Button>
                  <Button fullWidth onClick={() => handleAddUnavailability('Feriado')} className="py-4 min-h-[56px]">
                    🎉 Feriado
                  </Button>
                  <Button fullWidth onClick={() => handleAddUnavailability('Otro')} className="py-4 min-h-[56px]">
                    📝 Otro motivo
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-center text-[var(--color-text-secondary)] py-2">
                    Este día tiene una novedad activa.
                  </p>
                  <Button fullWidth variant="danger" onClick={handleRemoveUnavailability} className="py-4 min-h-[56px]">
                    ❌ Quitar novedad
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FAB — botón flotante para pagar */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-24 right-4 z-40 w-16 h-16 rounded-full bg-[var(--color-success)] text-white shadow-xl flex items-center justify-center text-3xl font-bold active:scale-90 transition-transform hover:brightness-110"
      >
        💸
      </button>
    </div>
  )
}
