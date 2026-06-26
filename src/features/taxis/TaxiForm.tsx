import { useState } from 'react'
import { TextInput, Select } from '../../shared/ui/FormField'
import { Button } from '../../shared/ui/Button'
import type { Taxi, DayOfWeek } from '../../types'

interface Props {
  initial?: Taxi
  onSave: (data: Omit<Taxi, 'id' | 'created_at' | 'accumulated_savings'>) => void
  onCancel: () => void
}

const REST_DAY_OPTIONS: { value: string; label: string }[] = [
  { value: 'Lunes', label: 'Lunes' },
  { value: 'Martes', label: 'Martes' },
  { value: 'Miércoles', label: 'Miércoles' },
  { value: 'Jueves', label: 'Jueves' },
  { value: 'Viernes', label: 'Viernes' },
  { value: 'Sábado', label: 'Sábado' },
  { value: 'Domingo', label: 'Domingo' },
]

export function TaxiForm({ initial, onSave, onCancel }: Props) {
  const [plate, setPlate] = useState(initial?.plate ?? '')
  const [driverName, setDriverName] = useState(initial?.driver_name ?? '')
  const [restDay, setRestDay] = useState<DayOfWeek>(initial?.rest_day ?? 'Domingo')
  const [dailyFee, setDailyFee] = useState(String(initial?.daily_fee ?? ''))
  const [dailySavings, setDailySavings] = useState(String(initial?.daily_savings ?? ''))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!plate.trim()) errs.plate = 'La placa es obligatoria'
    if (!driverName.trim()) errs.driverName = 'El nombre del motorista es obligatorio'
    if (!dailyFee || Number(dailyFee) <= 0) errs.dailyFee = 'Ingrese un valor válido'
    if (!dailySavings || Number(dailySavings) < 0) errs.dailySavings = 'Ingrese un valor válido'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSave({
      plate: plate.trim().toUpperCase(),
      driver_name: driverName.trim(),
      rest_day: restDay,
      daily_fee: Number(dailyFee),
      daily_savings: Number(dailySavings),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center bg-[var(--color-surface-overlay)] p-4">
      <div className="rounded-2xl bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-card)] border border-[var(--color-border)] w-full max-w-md mx-auto space-y-4">
        <h2 className="text-xl font-bold">{initial ? 'Editar taxi' : 'Nuevo taxi'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput
            label="Placa"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            error={errors.plate}
            placeholder="ABC-123"
            autoFocus
          />
          <TextInput
            label="Nombre del motorista"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            error={errors.driverName}
            placeholder="Ej: Juan Pérez"
          />
          <Select
            label="Día de descanso"
            value={restDay}
            onChange={(e) => setRestDay(e.target.value as DayOfWeek)}
            options={REST_DAY_OPTIONS}
          />
          <TextInput
            label="Cuota diaria ($)"
            type="number"
            value={dailyFee}
            onChange={(e) => setDailyFee(e.target.value)}
            error={errors.dailyFee}
            placeholder="80000"
          />
          <TextInput
            label="Ahorro diario ($)"
            type="number"
            value={dailySavings}
            onChange={(e) => setDailySavings(e.target.value)}
            error={errors.dailySavings}
            placeholder="5000"
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" fullWidth onClick={onCancel} type="button">
              Cancelar
            </Button>
            <Button fullWidth type="submit">
              {initial ? 'Guardar cambios' : 'Agregar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
