import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'accent' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--color-primary)] text-[var(--color-text-inverse)] hover:brightness-110 shadow-md',
  accent:
    'bg-[var(--color-accent)] text-[#1B1B1B] hover:bg-[var(--color-accent-hover)] shadow-md hover:shadow-lg',
  danger:
    'bg-[var(--color-danger)] text-white hover:brightness-110 shadow-md',
  ghost:
    'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-text)]',
}

export function Button({
  variant = 'primary',
  children,
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl px-6 py-3 font-bold
        transition-all duration-150 active:scale-95 select-none min-h-[52px] min-w-[52px] text-lg
        ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
