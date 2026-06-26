import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  style?: Record<string, string>
  onClick?: () => void
}

export function Card({ children, className = '', style, onClick }: CardProps) {
  return (
    <div
      className={`rounded-2xl p-5 border
        bg-[var(--color-surface-card)] border-[var(--color-border)]
        shadow-[var(--shadow-card)]
        ${onClick ? 'cursor-pointer hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 active:scale-[0.99]' : ''}
        transition-all duration-200 ${className}`}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick() } : undefined}
    >
      {children}
    </div>
  )
}
