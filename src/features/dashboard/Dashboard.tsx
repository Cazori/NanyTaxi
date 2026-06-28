import { useDashboardStats, useExpiryAlerts } from '../../db/hooks'
import { Card } from '../../shared/ui/Card'
import { Badge } from '../../shared/ui/Badge'
import { Button } from '../../shared/ui/Button'
import { useNavigate } from 'react-router-dom'

export function Dashboard() {
  const navigate = useNavigate()
  const { paidCount, totalTaxis, totalAmount, pendingNames, criticalAlerts } = useDashboardStats()
  const alerts = useExpiryAlerts()

  const today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <>
      <p className="text-[var(--color-text-secondary)] text-base capitalize animate-fade-in-up">{today}</p>

      {criticalAlerts.length > 0 && (
        <div className="rounded-2xl p-4 text-white font-bold text-lg animate-fade-in-up" style={{ backgroundColor: 'var(--color-danger)' }}>
          ⚠ {criticalAlerts.length} vencimiento{criticalAlerts.length > 1 ? 's' : ''} crítico{criticalAlerts.length > 1 ? 's' : ''}
          <div className="text-sm font-normal mt-1">
            {criticalAlerts.map((a) => (
              <div key={a.insuranceId}>
                {a.type} {a.taxiPlate} — {a.daysRemaining <= 0 ? `${Math.abs(a.daysRemaining)} días vencido` : `${a.daysRemaining} días`}
              </div>
            ))}
          </div>
        </div>
      )}

      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">Pagos de hoy</h2>
            <p className="text-3xl font-bold text-[var(--color-accent)] mt-1">
              ${totalAmount.toLocaleString('es-CO')}
            </p>
            <p className="text-[var(--color-text-secondary)] mt-1">
              {paidCount} de {totalTaxis} taxi{totalTaxis > 1 ? 's' : ''} pagaron
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent-soft)] flex items-center justify-center text-2xl">💰</div>
        </div>
        {pendingNames.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-danger)] font-semibold">
              ⏳ Faltan: {pendingNames.join(', ')}
            </p>
          </div>
        )}
      </Card>

      <div className="flex gap-3">
        <Button variant="accent" fullWidth onClick={() => navigate('/taxis')}>➕ Registrar pago</Button>
        <Button variant="primary" fullWidth onClick={() => navigate('/taxis')}>🚕 Ver taxis</Button>
      </div>

      {alerts.filter((a) => a.level !== 'ok').length > 0 && (
        <Card>
          <h2 className="text-lg font-bold text-[var(--color-text)] mb-3">Próximos vencimientos</h2>
          <div className="space-y-2">
            {alerts.filter((a) => a.level !== 'ok').slice(0, 5).map((a) => (
              <div key={a.insuranceId} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{a.type}</span>
                  <span className="text-[var(--color-text-muted)] text-sm">{a.taxiPlate}</span>
                </div>
                <Badge level={a.level}>
                  {a.daysRemaining <= 0 ? 'Vencido' : `${a.daysRemaining} días`}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {alerts.length === 0 && (
        <Card>
          <div className="text-center py-6">
            <p className="text-4xl mb-2">📋</p>
            <p className="text-[var(--color-text-muted)]">No hay seguros registrados aún.</p>
            <Button variant="ghost" className="mt-3" onClick={() => navigate('/insurance')}>+ Agregar seguro</Button>
          </div>
        </Card>
      )}
    </>
  )
}
