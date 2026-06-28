import { NavLink } from 'react-router-dom'
import { useTheme } from '../../shared/ThemeContext'

const tabs = [
  { to: '/', label: 'Tablero', icon: '📊' },
  { to: '/taxis', label: 'Taxis', icon: '🚕' },
  { to: '/insurance', label: 'Seguros', icon: '📋' },
]

export function NavBar() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-surface-card)] border-t-2 border-[var(--color-border)] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] safe-bottom">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px] rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-[var(--color-accent)] font-bold scale-105'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="text-2xl leading-none">{tab.icon}</span>
                <span className="text-xs font-medium leading-tight">{tab.label}</span>
                {isActive && (
                  <span className="block w-1 h-1 rounded-full bg-[var(--color-accent)] mt-0.5" />
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px] rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-all duration-200"
          aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          <span className="text-2xl leading-none">{isDark ? '☀️' : '🌙'}</span>
          <span className="text-xs font-medium leading-tight">Tema</span>
        </button>
      </div>
    </nav>
  )
}
