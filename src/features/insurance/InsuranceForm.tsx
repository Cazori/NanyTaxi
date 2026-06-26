import { useState } from 'react'
import { TextInput, Select } from '../../shared/ui/FormField'
import { Button } from '../../shared/ui/Button'
import { useTaxis } from '../../db/hooks'
import type { Insurance, InsuranceType } from '../../types'

const INSURANCE_TYPES: InsuranceType[] = [
  'SOAT', 'Tecnomecánica', 'Tarjeta de Operaciones', 'Impuestos',
  'Seguro Contractual', 'Seguro Extracontractual',
]

const typeOptions = INSURANCE_TYPES.map((t) => ({ value: t, label: t }))

interface Props {
  initial?: Insurance
  onSave: (data: Omit<Insurance, 'id' | 'created_at'>) => void
  onCancel: () => void
}

export function InsuranceForm({ initial, onSave, onCancel }: Props) {
  const { taxis } = useTaxis()
  const [taxiPlate, setTaxiPlate] = useState(initial?.taxi_plate ?? '')
  const [type, setType] = useState<InsuranceType>(initial?.type ?? 'SOAT')
  const [issueDate, setIssueDate] = useState(initial?.issue_date ?? '')
  const [expiryDate, setExpiryDate] = useState(initial?.expiry_date ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const taxiOptions = taxis.map((t) => ({ value: t.plate, label: t.plate }))

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!taxiPlate) errs.taxiPlate = 'Seleccione un taxi'
    if (!issueDate) errs.issueDate = 'Fecha obligatoria'
    if (!expiryDate) errs.expiryDate = 'Fecha obligatoria'
    if (issueDate && expiryDate && expiryDate < issueDate) {
      errs.expiryDate = 'La fecha de vencimiento debe ser posterior a la de expedición'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const isPastExpiry = expiryDate && new Date(expiryDate) < new Date()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSave({
      taxi_plate: taxiPlate,
      type,
      issue_date: issueDate,
      expiry_date: expiryDate,
      notes: notes.trim() || undefined,
      renewed: initial?.renewed ?? false,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center bg-[var(--color-surface-overlay)] p-4">
      <div className="rounded-2xl bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-card)] border border-[var(--color-border)] w-full max-w-md mx-auto space-y-4">
        <h2 className="text-xl font-bold">{initial ? 'Editar seguro' : 'Nuevo seguro'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Taxi" value={taxiPlate} onChange={(e) => setTaxiPlate(e.target.value)} options={taxiOptions} />
          <Select label="Tipo de seguro" value={type} onChange={(e) => setType(e.target.value as InsuranceType)} options={typeOptions} />
          <TextInput label="Fecha de expedición" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} error={errors.issueDate} />
          <TextInput label="Fecha de vencimiento" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} error={errors.expiryDate} />
          {isPastExpiry && <p className="text-sm text-[var(--color-warning)] font-medium">⚠ Este seguro ya está vencido</p>}
          <TextInput label="Notas (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones" />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" fullWidth onClick={onCancel} type="button">Cancelar</Button>
            <Button fullWidth type="submit">{initial ? 'Guardar cambios' : 'Agregar'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
