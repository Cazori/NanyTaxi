import type { AlertLevel } from '../../types'

interface BadgeProps {
  level?: AlertLevel
  children: string
}

const levelClasses: Record<AlertLevel, string> = {
  critical: 'bg-[var(--color-danger)] text-white',
  warning: 'bg-[var(--color-warning)] text-black',
  ok: 'bg-[var(--color-success)] text-white',
}

export function Badge({ level = 'ok', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${levelClasses[level]}`}>
      {children}
    </span>
  )
}
