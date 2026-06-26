export interface Taxi {
  id: number
  plate: string
  driver_name: string
  rest_day: DayOfWeek
  daily_fee: number
  daily_savings: number
  accumulated_savings: number
  created_at: string
}

export interface Payment {
  id: number
  taxi_plate: string
  amount: number
  /** Transaction date (when the payment was received) */
  date: string // YYYY-MM-DD
  /** Which specific days this payment covers (YYYY-MM-DD) */
  covered_days: string[]
  created_at: string
}

export interface DayCoverage {
  date: string
  day: number
  status: 'paid' | 'pending' | 'overdue' | 'rest' | 'future'
  amount?: number
}

export type InsuranceType =
  | 'SOAT'
  | 'Tecnomecánica'
  | 'Tarjeta de Operaciones'
  | 'Impuestos'
  | 'Seguro Contractual'
  | 'Seguro Extracontractual'

export interface Insurance {
  id: number
  taxi_plate: string
  type: InsuranceType
  issue_date: string
  expiry_date: string
  notes?: string
  renewed: boolean
  created_at: string
}

export interface SavingsEntry {
  id: number
  taxi_plate: string
  amount: number
  date: string
  reason: string
  created_at: string
}

export type DayOfWeek =
  | 'Lunes'
  | 'Martes'
  | 'Miércoles'
  | 'Jueves'
  | 'Viernes'
  | 'Sábado'
  | 'Domingo'

export type AlertLevel = 'critical' | 'warning' | 'ok'

export interface ExpiryAlert {
  insuranceId: number
  taxiPlate: string
  type: InsuranceType
  expiryDate: string
  daysRemaining: number
  level: AlertLevel
}
