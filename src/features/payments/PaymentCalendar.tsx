import type { DayCoverage } from '../../types'

interface Props {
  coverage: DayCoverage[]
  yearMonth: string
  dailyFee: number
  dailySavings: number
}

const DAY_HEADERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function statusStyle(status: DayCoverage['status']): string {
  switch (status) {
    case 'paid':
      return 'bg-[var(--color-success-soft)] text-[var(--color-success)] font-bold border-[var(--color-success)]'
    case 'overdue':
      return 'bg-[var(--color-danger-soft)] text-[var(--color-danger)] font-bold border-[var(--color-danger)]'
    case 'rest':
      return 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-transparent opacity-40'
    case 'future':
      return 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]'
    default:
      return 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]'
  }
}

function statusIcon(status: DayCoverage['status']): string {
  switch (status) {
    case 'paid': return '✓'
    case 'overdue': return '!'
    case 'rest': return '🙌'
    case 'future': return ''
    default: return ''
  }
}

export function PaymentCalendar({ coverage, yearMonth, dailyFee, dailySavings }: Props) {
  // Build a grid: first day of month determines offset
  const [year, m] = yearMonth.split('-').map(Number)
  const firstDay = new Date(year, m - 1, 1).getDay() // 0=Sun
  // Shift so Monday=0
  const offset = firstDay === 0 ? 6 : firstDay - 1
  const totalCells = offset + coverage.length
  const rows = Math.ceil(totalCells / 7)
  const grid: (DayCoverage | null)[] = []

  // Empty cells before first day
  for (let i = 0; i < offset; i++) grid.push(null)
  for (const day of coverage) grid.push(day)
  // Fill remaining cells
  while (grid.length < rows * 7) grid.push(null)

  const paidCount = coverage.filter((d) => d.status === 'paid').length
  const overdueCount = coverage.filter((d) => d.status === 'overdue').length
  const restCount = coverage.filter((d) => d.status === 'rest').length
  const dailyTotal = dailyFee + dailySavings
  const estimatedDebt = overdueCount * dailyTotal
  const estimatedIncome = paidCount * dailyFee

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4 shadow-[var(--shadow-card)]">
      {/* Month & stats header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg text-[var(--color-text)]">
          {new Date(year, m - 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
        </h3>
      </div>

      {/* Quick stats */}
      <div className="flex gap-3 text-xs mb-3 flex-wrap">
        <span className="text-[var(--color-success)] font-semibold">
          ✅ {paidCount} día{paidCount > 1 ? 's' : ''} pagado{paidCount > 1 ? 's' : ''}
        </span>
        {overdueCount > 0 && (
          <span className="text-[var(--color-danger)] font-semibold">
            🔴 {overdueCount} vencido{overdueCount > 1 ? 's' : ''}
          </span>
        )}
        <span className="text-[var(--color-text-muted)]">
          🙌 {restCount} descanso{restCount > 1 ? 's' : ''}
        </span>
      </div>

      {overdueCount > 0 && (
        <div className="bg-[var(--color-danger-soft)] rounded-xl p-3 mb-3">
          <p className="text-sm text-[var(--color-danger)] font-semibold">
            ⚠ Deuda estimada: <strong>${estimatedDebt.toLocaleString('es-CO')}</strong>
            {' · '}Ingreso: <strong className="text-[var(--color-success)]">+${estimatedIncome.toLocaleString('es-CO')}</strong>
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            {dailyFee.toLocaleString('es-CO')}/día + {dailySavings.toLocaleString('es-CO')} ahorro
          </p>
        </div>
      )}

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_HEADERS.map((h) => (
          <div key={h} className="text-center text-xs font-bold text-[var(--color-text-muted)] py-1">
            {h}
          </div>
        ))}
        {grid.map((cell, i) =>
          cell ? (
            <div
              key={i}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl border-2 text-sm font-bold
                ${statusStyle(cell.status)} transition-transform active:scale-95`}
              title={`${cell.date}: ${cell.status === 'paid' ? 'Pagado' : cell.status === 'overdue' ? 'Vencido' : cell.status === 'rest' ? 'Descanso' : 'Futuro'}`}
            >
              <span className="leading-none">{cell.day}</span>
              {statusIcon(cell.status) && (
                <span className="text-[10px] leading-none mt-0.5">{statusIcon(cell.status)}</span>
              )}
            </div>
          ) : (
            <div key={i} />
          )
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-3 mt-3 text-[10px] text-[var(--color-text-muted)] justify-center">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[var(--color-success-soft)] border border-[var(--color-success)]" /> Pagado</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[var(--color-danger-soft)] border border-[var(--color-danger)]" /> Vencido</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[var(--color-surface)] opacity-40" /> Descanso</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[var(--color-surface)] border border-[var(--color-border)]" /> Futuro</span>
      </div>
    </div>
  )
}
