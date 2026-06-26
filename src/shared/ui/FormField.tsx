import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react'

interface FieldProps {
  label: string
  error?: string
  children: ReactNode
}

export function FormField({ label, error, children }: FieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-base font-semibold text-[var(--color-text)] mb-1">{label}</label>
      {children}
      {error && <p className="text-sm text-[var(--color-danger)] font-medium">{error}</p>}
    </div>
  )
}

const inputClasses =
  'w-full rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface-card)] text-[var(--color-text)] px-4 py-3 text-lg ' +
  'focus:border-[var(--color-border-focus)] focus:outline-none placeholder:text-[var(--color-text-muted)] transition-colors duration-200'

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function TextInput({ label, error, id, ...props }: TextInputProps) {
  return (
    <FormField label={label} error={error}>
      <input id={id} className={inputClasses} {...props} />
    </FormField>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, options, id, ...props }: SelectProps) {
  return (
    <FormField label={label} error={error}>
      <select id={id} className={inputClasses} {...props}>
        <option value="">Seleccionar...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormField>
  )
}
