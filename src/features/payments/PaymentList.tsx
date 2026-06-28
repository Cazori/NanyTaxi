import { useState, useEffect } from 'react'
import { usePayments, useTaxis, useUnavailability, useManualCoverage } from '../../db/hooks'
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
  const { addUnavailability, removeUnavailability } = useUnavailability()
  const { addManualCoverage, removeManualCoverage } = useManualCoverage()
  const [selectedPlate, setSelectedPlate] = useState<string | undefined>()
  const MIN_MONTH = '2026-06'
  const [selectedMonth, setSelectedMonth] = useState(MIN_MONTH)
  const [refreshKey, setRefreshKey] = useState(0)
  const { payments, getCoverageForMonth, getMonthlySummary, deletePayment } = usePayments(selectedPlate, selectedMonth, refreshKey)
  const [showForm, setShowForm] = useState(false)
  const [formPlate, setFormPlate] = useState<string | undefined>()
  const [editPayment, setEditPayment] = useState<Payment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null)
  const [coverage, setCoverage] = useState<DayCoverage[]>([])
  const [summary, setSummary] = useState<{ paidDays: number; totalAmount: number; totalDays: number; overdueDays: number; restDays: number; unavailabilityDays: number } | null>(null)
  const [loadingCoverage, setLoadingCoverage] = useState(false)

  // Unavailability management
  const [unavailTarget, setUnavailTarget] = useState<{ date: string; status: DayCoverage['status']; manuallyCovered?: boolean } | null>(null)

  // Auto-seleccionar el primer taxi al cargar
  useEffect(() => {
    if (!selectedPlate && taxis.length > 0) {
      setSelectedPlate(taxis[0].plate)
    }
  }, [taxis, selectedPlate])

  const selectedTaxi = taxis.find((t) => t.plate === selectedPlate)
  const formatCurrency = (n: number) => `$${n.toLocaleString('es-CO')}`

  useEffect(() => {
    if (!selectedPlate || !selectedMonth) { setCoverage([]); setSummary(null); return }
    let cancelled = false
    setLoadingCoverage(true)
    Promise.all([
      getCoverageForMonth(selectedPlate, selectedMonth),
      getMonthlySummary(selectedPlate, selectedMonth),
    ]).then(([c, s]) => {
      if (cancelled) return
      setCoverage(c); setSummary(s)
    }).finally(() => { if (!cancelled) setLoadingCoverage(false) })
    return () => { cancelled = true }
  }, [selectedPlate, selectedMonth, getCoverageForMonth, getMonthlySummary, refreshKey])

  const refreshAll = () => {
    setRefreshKey((k) => k + 1)
  }

  const handlePay = (plate: string) => {
    setFormPlate(plate)
    setShowForm(true)
  }

  const handleFormSaved = () => {
    setShowForm(false)
    setFormPlate(undefined)
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
    if (!selectedPlate) return
    setUnavailTarget({ date, status, manuallyCovered })
  }

  const handleAddUnavailability = async (reason: string) => {
    if (!selectedPlate || !unavailTarget) return
    try {
      await addUnavailability(selectedPlate, unavailTarget.date, reason)
      toast(`Día marcado como ${reason.toLowerCase()}`)
      setUnavailTarget(null)
      refreshAll()
    } catch { toast('Error al guardar', 'error') }
  }

  const handleRemoveUnavailability = async () => {
    if (!selectedPlate || !unavailTarget) return
    try {
      await removeUnavailability(selectedPlate, unavailTarget.date)
      toast('Novedad eliminada')
      setUnavailTarget(null)
      refreshAll()
    } catch { toast('Error al eliminar', 'error') }
  }

  const isUnavail = coverage.find((d) => d.date === unavailTarget?.date)?.status === 'unavailability'
  const isManuallyCovered = !!unavailTarget?.manuallyCovered
  const isAutoPaid = unavailTarget?.status === 'paid' && !unavailTarget?.manuallyCovered

  const handleAddManualCoverage = async () => {
    if (!selectedPlate || !unavailTarget) return
    try {
      await addManualCoverage(selectedPlate, unavailTarget.date)
      toast('Día marcado como pagado manualmente ✅')
      setUnavailTarget(null)
      refreshAll()
    } catch { toast('Error al marcar', 'error') }
  }

  const handleRemoveManualCoverage = async () => {
    if (!selectedPlate || !unavailTarget) return
    try {
      await removeManualCoverage(selectedPlate, unavailTarget.date)
      toast('Marca manual eliminada')
      setUnavailTarget(null)
      refreshAll()
    } catch { toast('Error al eliminar', 'error') }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-primary)]">Pagos</h1>

      {/* Taxi pills — selector horizontal */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {taxis.map((taxi) => {
          const isSelected = selectedPlate === taxi.plate
          return (
            <button
              key={taxi.plate}
              onClick={() => setSelectedPlate(taxi.plate)}
              className={`shrink-0 rounded-2xl px-6 py-3 min-h-[60px] font-bold text-lg transition-all ${
                isSelected
                  ? 'bg-[var(--color-primary)] text-[var(--color-text-inverse)] shadow-lg ring-2 ring-[var(--color-primary)]/50'
                  : 'bg-[var(--color-surface-card)] text-[var(--color-text)] border-2 border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
              }`}
            >
              <span className="block text-xl">🚕 {taxi.plate}</span>
              <span className="block text-xs font-normal opacity-80 whitespace-nowrap">{taxi.driver_name}</span>
            </button>
          )
        })}
      </div>

      {taxis.length === 0 && (
        <Card className="animate-fade-in-up">
          <div className="text-center py-6">
            <p className="text-5xl mb-3">🚕</p>
            <p className="text-[var(--color-text-muted)] font-medium">No hay taxis registrados</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Primero agregá un taxi desde la pestaña Taxis</p>
          </div>
        </Card>
      )}

      {/* Selected taxi: calendar + summary + payments */}
      {selectedPlate && selectedTaxi && (
        <>
          {/* Calendar */}
          {loadingCoverage && (
            <Card><p className="text-center text-[var(--color-text-muted)] py-4">Cargando...</p></Card>
          )}
          {!loadingCoverage && coverage.length > 0 && (
            <PaymentCalendar
              coverage={coverage}
              yearMonth={selectedMonth}
              dailyFee={selectedTaxi.daily_fee}
              dailySavings={selectedTaxi.daily_savings}
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
                  <p className="text-lg font-bold text-[var(--color-text)]">{selectedTaxi.driver_name}</p>
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
        </>
      )}

      {/* Payment form */}
      {showForm && (
        <PaymentForm
          defaultPlate={formPlate}
          onSave={handleFormSaved}
          onCancel={() => { setShowForm(false); setFormPlate(undefined) }}
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
            {/* Header */}
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
                <p className="text-center text-[var(--color-text-secondary)] py-4">
                  ✅ Este día está cubierto por un pago registrado.
                  <br />Si necesitás, podés marcar una novedad abajo.
                </p>
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
      {selectedPlate && (
        <button
          onClick={() => handlePay(selectedPlate)}
          className="fixed bottom-24 right-4 z-40 w-16 h-16 rounded-full bg-[var(--color-success)] text-white shadow-xl flex items-center justify-center text-3xl font-bold active:scale-90 transition-transform hover:brightness-110"
        >
          💸
        </button>
      )}
    </div>
  )
}
