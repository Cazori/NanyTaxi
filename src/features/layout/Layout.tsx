import { Outlet } from 'react-router-dom'
import { NavBar } from './NavBar'
import { useTheme } from '../../shared/ThemeContext'

export function Layout() {
  const { isDark } = useTheme()

  return (
    <div className="min-h-screen pb-safe bg-[var(--color-surface)] bg-taxi-pattern bg-taxi-stripe">
      {/* Decorative top accent stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[var(--color-accent)] via-amber-400 to-[var(--color-accent)] shadow-[0_2px_8px_rgba(255,193,7,0.3)]" />

      {/* Brand header */}
      <header className="sticky top-0 z-30 bg-[var(--color-surface-card)]/90 backdrop-blur-md border-b border-[var(--color-border)]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)] flex items-center justify-center text-xl font-bold text-[#1B1B1B] shadow-[var(--shadow-glow)]">
            🚕
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[var(--color-text)] tracking-tight">
              Nanytaxi
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] -mt-0.5">
              {isDark ? '🌟' : '☀️'} Gestión de taxis
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <Outlet />
      </main>

      <NavBar />
    </div>
  )
}
