import type { DayCoverage } from '../../types'

interface Props {
  coverage: DayCoverage[]
  yearMonth: string
  dailyFee: number
  dailySavings: number
  onDayClick?: (date: string, status: DayCoverage['status']) => void
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
    case 'unavailability':
      return 'bg-yellow-100 text-yellow-800 font-bold border-yellow-400 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-600'
    default:
      return 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]'
  }
}

function statusIcon(status: DayCoverage['status'], reason?: string): string {
  switch (status) {
    case 'paid': return '✓'
    case 'overdue': return '!'
    case 'rest': return '🙌'
    case 'unavailability':
      if (reason?.toLowerCase().includes('taller') || reason?.toLowerCase().includes('mecánica')) return '🔧'
      if (reason?.toLowerCase().includes('incapacidad') || reason?.toLowerCase().includes('enfermed') || reason?.toLowerCase().includes('médico')) return '🏥'
      if (reason?.toLowerCase().includes('feriado') || reason?.toLowerCase().includes('festivo')) return '🎉'
      return '⚠'
    case 'future': return ''
    default: return ''
  }
}

export function PaymentCalendar({ coverage, yearMonth, dailyFee, dailySavings, onDayClick }: Props) {
  const [year, m] = yearMonth.split('-').map(Number)
  const firstDay = new Date(year, m - 1, 1).getDay()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  const totalCells = offset + coverage.length
  const rows = Math.ceil(totalCells / 7)
  const grid: (DayCoverage | null)[] = []

  for (let i = 0; i < offset; i++) grid.push(null)
  for (const day of coverage) grid.push(day)
  while (grid.length < rows * 7) grid.push(null)

  const paidCount = coverage.filter((d) => d.status === 'paid').length
  const overdueCount = coverage.filter((d) => d.status === 'overdue').length
  const restCount = coverage.filter((d) => d.status === 'rest').length
  const unavailCount = coverage.filter((d) => d.status === 'unavailability').length
  const dailyTotal = dailyFee + dailySavings
  const estimatedDebt = overdueCount * dailyTotal
  const estimatedIncome = paidCount * dailyFee

  const handleClick = (cell: DayCoverage) => {
    if (!onDayClick) return
    if (cell.status === 'rest') return
    onDayClick(cell.date, cell.status)
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg text-[var(--color-text)]">
          {new Date(year, m - 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
        </h3>
      </div>

      <div className="flex gap-3 text-xs mb-3 flex-wrap">
        <span className="text-[var(--color-success)] font-semibold">
          ✅ {paidCount} día{paidCount > 1 ? 's' : ''} pagado{paidCount > 1 ? 's' : ''}
        </span>
        {overdueCount > 0 && (
          <span className="text-[var(--color-danger)] font-semibold">
            🔴 {overdueCount} vencido{overdueCount > 1 ? 's' : ''}
          </span>
        )}
        {unavailCount > 0 && (
          <span className="text-yellow-600 dark:text-yellow-400 font-semibold">
            ⚠ {unavailCount} taller/incapacidad
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

      <div className="grid grid-cols-7 gap-1">
        {DAY_HEADERS.map((h) => (
          <div key={h} className="text-center text-xs font-bold text-[var(--color-text-muted)] py-1">
            {h}
          </div>
        ))}
        {grid.map((cell, i) =>
          cell ? (
            <button
              key={i}
              type="button"
              onClick={() => handleClick(cell)}
              disabled={cell.status === 'rest'}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl border-2 text-sm font-bold
                ${statusStyle(cell.status)} transition-transform active:scale-95
                ${onDayClick && cell.status !== 'rest' ? 'cursor-pointer hover:ring-2 hover:ring-[var(--color-primary)]/50' : 'cursor-default'}`}
              title={
                cell.status === 'paid' ? 'Pagado — click para marcar novedad' :
                cell.status === 'overdue' ? 'Vencido — click para marcar novedad' :
                cell.status === 'unavailability' ? `${cell.unavailabilityReason ?? 'Novedad'} — click para gestionar` :
                cell.status === 'rest' ? 'Descanso' : 'Futuro'
              }
            >
              <span className="leading-none">{cell.day}</span>
              {statusIcon(cell.status, cell.unavailabilityReason) && (
                <span className="text-[10px] leading-none mt-0.5">{statusIcon(cell.status, cell.unavailabilityReason)}</span>
              )}
            </button>
          ) : (
            <div key={i} />
          )
        )}
      </div>

      <div className="flex gap-3 mt-3 text-[10px] text-[var(--color-text-muted)] justify-center flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[var(--color-success-soft)] border border-[var(--color-success)]" /> Pagado</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[var(--color-danger-soft)] border border-[var(--color-danger)]" /> Vencido</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400" /> Taller/Inc.</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[var(--color-surface)] opacity-40" /> Descanso</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[var(--color-surface)] border border-[var(--color-border)]" /> Futuro</span>
      </div>
    </div>
  )
}
