import { useState, useEffect, useMemo } from 'react'
import { TextInput, Select } from '../../shared/ui/FormField'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { usePayments, useTaxis, getAllCoveredDates, calculateSequentialCoverage } from '../../db/hooks'
import type { DayOfWeek } from '../../types'

interface Props {
  editData?: { paymentId: number; taxiPlate: string; amount: number; date: string }
  /** Placa del taxi para prefijar en pagos nuevos */
  defaultPlate?: string
  onSave: () => void
  onCancel: () => void
}

const DAY_INDEX: Record<DayOfWeek, number> = {
  Domingo: 0, Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6,
}

export function PaymentForm({ editData, defaultPlate: initialPlate, onSave, onCancel }: Props) {
  const { taxis } = useTaxis()
  const { registerPayment, updatePayment } = usePayments()

  const today = new Date().toISOString().slice(0, 10)

  const [selectedPlate, setSelectedPlate] = useState(editData?.taxiPlate ?? initialPlate ?? '')
  const [amount, setAmount] = useState(editData ? String(editData.amount) : '')
  const [date, setDate] = useState(editData?.date ?? today)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)

  /** Días ya cubiertos para el taxi seleccionado (para preview) */
  const [existingCovered, setExistingCovered] = useState<Set<string>>(new Set())

  const taxi = taxis.find((t) => t.plate === selectedPlate)
  const dailyTotal = taxi ? taxi.daily_fee + taxi.daily_savings : 0
  const numAmount = Number(amount)

  // Cargar días cubiertos al cambiar de taxi
  useEffect(() => {
    if (!selectedPlate) { setExistingCovered(new Set()); return }
    getAllCoveredDates(selectedPlate).then(setExistingCovered)
  }, [selectedPlate, editData])

  const coveragePreview = useMemo(() => {
    if (!taxi || !numAmount || numAmount < dailyTotal || dailyTotal <= 0) return null
    const restDayIndex = DAY_INDEX[taxi.rest_day]
    const coveredDays = calculateSequentialCoverage(numAmount, existingCovered, restDayIndex, dailyTotal)
    if (coveredDays.length === 0) return null
    const savingsAmount = taxi.daily_savings * coveredDays.length
    // Encontrar el primer y último día cubierto
    const fromDate = new Date(coveredDays[0])
    const lastDate = new Date(coveredDays[coveredDays.length - 1])
    return {
      fullDays: coveredDays.length,
      savingsAmount,
      fromDate,
      lastDate,
    }
  }, [taxi, numAmount, dailyTotal, existingCovered])

  const handlePlateChange = (plate: string) => {
    setSelectedPlate(plate)
    const t = taxis.find((tx) => tx.plate === plate)
    if (t) setAmount(String(t.daily_fee + t.daily_savings))
    else setAmount('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!selectedPlate || !amount || !date) {
      setError('Todos los campos son obligatorios')
      return
    }
    if (numAmount <= 0) { setError('El monto debe ser mayor a 0'); return }
    if (!taxi) { setError('Seleccioná un taxi'); return }
    setConfirming(true)
  }

  const confirmSave = async () => {
    setSaving(true)
    setError('')
    try {
      if (editData) {
        await updatePayment(editData.paymentId, {
          taxi_plate: selectedPlate,
          amount: numAmount,
          date,
        })
      } else {
        await registerPayment({
          taxi_plate: selectedPlate,
          amount: numAmount,
          date,
          covered_days: [],
        })
      }
      onSave()
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === 'DUPLICATE_PAYMENT') setError('Este taxi ya tiene un pago en esta fecha')
        else if (err.message.startsWith('DUPLICATE_DAY')) setError('Algunos días ya están cubiertos')
        else setError(`Error: ${err.message}`)
      } else setError('Error al registrar el pago')
      setConfirming(false)
    } finally { setSaving(false) }
  }

  const plateOptions = taxis.map((t) => ({
    value: t.plate,
    label: `${t.plate} — ${t.driver_name}`,
  }))

  const formatCurrency = (n: number) => `$${n.toLocaleString('es-CO')}`

  // ── Confirmation step ──
  if (confirming) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center bg-[var(--color-surface-overlay)] p-4">
        <Card className="w-full max-w-md mx-auto space-y-4">
          <h2 className="text-xl font-bold">Confirmar pago</h2>
          <div className="bg-[var(--color-accent-soft)] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text-secondary)]">Taxi</span>
              <span className="font-bold text-lg">{selectedPlate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text-secondary)]">Motorista</span>
              <span className="font-bold">{taxi?.driver_name}</span>
            </div>
            <div className="border-t border-[var(--color-border)] pt-2 flex items-center justify-between">
              <span className="text-[var(--color-text-secondary)]">Monto</span>
              <span className="font-bold text-2xl text-[var(--color-success)]">{formatCurrency(numAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Fecha</span>
              <span>{new Date(date).toLocaleDateString('es-CO')}</span>
            </div>
          </div>
          {coveragePreview && (
            <div className="bg-[var(--color-success-soft)] rounded-xl p-3 text-sm">
              <p className="font-bold text-[var(--color-success)]">
                ✅ Cubre {coveragePreview.fullDays} día{coveragePreview.fullDays > 1 ? 's' : ''}
              </p>
              <p className="text-[var(--color-text-secondary)]">
                {coveragePreview.fromDate.toLocaleDateString('es-CO')} → {coveragePreview.lastDate.toLocaleDateString('es-CO')}
              </p>
              <p className="text-[var(--color-text-muted)] text-xs mt-1">
                Se ponen al día los días vencidos más antiguos desde junio 2026
              </p>
              <div className="flex gap-3 mt-1 text-xs">
                <span>Cuota: {formatCurrency(taxi!.daily_fee * coveragePreview.fullDays)}</span>
                <span className="text-[var(--color-success)]">+ Ahorro: {formatCurrency(coveragePreview.savingsAmount)}</span>
              </div>
            </div>
          )}
          {dailyTotal > 0 && numAmount < dailyTotal && (
            <div className="bg-[var(--color-warning-soft)] rounded-xl p-2 text-xs text-[var(--color-warning)]">
              ⚠ Monto menor a la cuota diaria. Se marcará solo la fecha de pago.
            </div>
          )}
          {error && <p className="text-sm text-[var(--color-danger)] font-medium">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" fullWidth onClick={() => setConfirming(false)} type="button" disabled={saving}>
              ← Volver
            </Button>
            <Button fullWidth onClick={confirmSave} disabled={saving}>
              {saving ? 'Guardando...' : '✅ Confirmar pago'}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // ── Form step ──
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center bg-[var(--color-surface-overlay)] p-4">
      <div className="rounded-2xl bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-card)] border border-[var(--color-border)] w-full max-w-md mx-auto space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold">{editData ? 'Editar pago' : 'Registrar pago'}</h2>

        {/* Banner informativo: modelo secuencial */}
        <div className="bg-[var(--color-accent-soft)] rounded-xl p-3 text-xs space-y-1">
          <p className="font-semibold">📋 Cobertura secuencial desde junio 2026</p>
          <p className="text-[var(--color-text-muted)]">
            Los pagos ponen al día los días vencidos más antiguos primero.
            No podés saltarte deuda de meses anteriores.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Taxi"
            value={selectedPlate}
            onChange={(e) => handlePlateChange(e.target.value)}
            options={plateOptions}
          />

          {taxi && (
            <div className="bg-[var(--color-accent-soft)] rounded-xl p-3 text-sm space-y-1">
              <p>Motorista: <strong>{taxi.driver_name}</strong> · Descansa {taxi.rest_day}</p>
              <p>Cuota: <strong>{formatCurrency(taxi.daily_fee)}</strong> + Ahorro: <strong>{formatCurrency(taxi.daily_savings)}</strong></p>
              <p className="text-[var(--color-text-secondary)]">
                Total por día: <strong>{formatCurrency(dailyTotal)}</strong>
              </p>
              {taxi.accumulated_savings > 0 && (
                <p className="text-[var(--color-success)] text-xs font-semibold">
                  🏦 Ahorro acumulado: {formatCurrency(taxi.accumulated_savings)}
                </p>
              )}
            </div>
          )}

          <TextInput
            label="Monto ($)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={dailyTotal > 0 ? String(dailyTotal) : '85000'}
          />

          {coveragePreview && (
            <div className="bg-[var(--color-success-soft)] rounded-xl p-3 border border-[var(--color-success)]/20">
              <p className="text-sm font-bold text-[var(--color-success)]">
                ✅ Cubre {coveragePreview.fullDays} día{coveragePreview.fullDays > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                {coveragePreview.fromDate.toLocaleDateString('es-CO')} → {coveragePreview.lastDate.toLocaleDateString('es-CO')}
              </p>
            </div>
          )}

          {dailyTotal > 0 && numAmount > 0 && numAmount < dailyTotal && (
            <div className="bg-[var(--color-warning-soft)] rounded-xl p-2 text-xs text-[var(--color-warning)]">
              ⚠ Monto menor al total por día. Se marcará solo la fecha.
            </div>
          )}

          <TextInput
            label="Fecha de pago"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          {error && <p className="text-sm text-[var(--color-danger)] font-medium">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" fullWidth onClick={onCancel} type="button" disabled={saving}>
              Cancelar
            </Button>
            <Button fullWidth type="submit" disabled={saving}>
              {saving ? 'Guardando...' : '📋 Revisar y confirmar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
