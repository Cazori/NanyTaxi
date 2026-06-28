import { useState, useEffect, useMemo } from 'react'
import { TextInput, Select } from '../../shared/ui/FormField'
import { Button } from '../../shared/ui/Button'
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

  const _now = new Date()
  const today = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`

  const [selectedPlate, setSelectedPlate] = useState(editData?.taxiPlate ?? initialPlate ?? '')
  const [amount, setAmount] = useState(editData ? String(editData.amount) : '')
  const [date, setDate] = useState(editData?.date ?? today)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!selectedPlate || !amount || !date) {
      setError('Todos los campos son obligatorios')
      return
    }
    if (numAmount <= 0) { setError('El monto debe ser mayor a 0'); return }
    if (!taxi) { setError('Seleccioná un taxi'); return }

    setSaving(true)
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
    } finally { setSaving(false) }
  }

  const plateOptions = taxis.map((t) => ({
    value: t.plate,
    label: `${t.plate} — ${t.driver_name}`,
  }))

  const formatCurrency = (n: number) => `$${n.toLocaleString('es-CO')}`

  // ── Form ──
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-surface-overlay)] p-3 overflow-y-auto">
      <div className="rounded-2xl bg-[var(--color-surface-card)] p-4 shadow-[var(--shadow-card)] border border-[var(--color-border)] w-full max-w-md mx-auto space-y-3">
        <h2 className="text-xl font-bold">{editData ? 'Editar pago' : 'Registrar pago'}</h2>

        {/* Banner informativo: modelo secuencial */}
        <div className="bg-[var(--color-accent-soft)] rounded-xl px-3 py-2 text-xs">
          📋 Cobertura desde junio 2026 — se ponen al día los días vencidos más antiguos.
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Select
            label="Taxi"
            value={selectedPlate}
            onChange={(e) => handlePlateChange(e.target.value)}
            options={plateOptions}
          />

          {taxi && (
            <div className="bg-[var(--color-accent-soft)] rounded-xl p-2 text-sm space-y-1">
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
            <div className="bg-[var(--color-success-soft)] rounded-xl px-3 py-2 border border-[var(--color-success)]/20 text-xs">
              <p className="font-bold text-[var(--color-success)]">
                ✅ Cubre {coveragePreview.fullDays} día{coveragePreview.fullDays > 1 ? 's' : ''}
              </p>
              <p className="text-[var(--color-text-secondary)]">
                {coveragePreview.fromDate.toLocaleDateString('es-CO')} → {coveragePreview.lastDate.toLocaleDateString('es-CO')}
              </p>
            </div>
          )}

          {dailyTotal > 0 && numAmount > 0 && numAmount < dailyTotal && (
            <div className="bg-[var(--color-warning-soft)] rounded-xl px-3 py-2 text-xs text-[var(--color-warning)]">
              ⚠ Monto menor al total por día. Se marcará solo la fecha.
            </div>
          )}

          <TextInput
            label="Fecha de pago"
            type="date"
            value={date}
            min="2026-06-01"
            onChange={(e) => setDate(e.target.value)}
          />

          {error && <p className="text-sm text-[var(--color-danger)] font-medium">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" fullWidth onClick={onCancel} type="button" disabled={saving}>
              Cancelar
            </Button>
            <Button fullWidth type="submit" disabled={saving}>
              {saving ? 'Guardando...' : '💾 Pagar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
