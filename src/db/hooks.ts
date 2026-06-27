import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../api/supabase'
import type { Taxi, Payment, Insurance, ExpiryAlert, AlertLevel, DayCoverage, DayOfWeek, SavingsEntry, Unavailability } from '../types'

/* ─── Helpers ─── */

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

const DAY_INDEX: Record<DayOfWeek, number> = {
  Domingo: 0, Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6,
}

export async function getAllCoveredDates(taxiPlate: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('payments')
    .select('covered_days')
    .eq('taxi_plate', taxiPlate)
  const covered = new Set<string>()
  if (data) {
    for (const p of data) {
      if (p.covered_days && Array.isArray(p.covered_days)) {
        for (const d of p.covered_days) covered.add(d)
      }
    }
  }
  return covered
}

export async function getAllUnavailabilityDates(taxiPlate: string): Promise<Map<string, string>> {
  const { data } = await supabase
    .from('unavailability')
    .select('date, reason')
    .eq('taxi_plate', taxiPlate)
  const unavail = new Map<string, string>()
  if (data) {
    for (const u of data) unavail.set(u.date, u.reason)
  }
  return unavail
}

/** Recalcula la cobertura COMPLETA de un taxi desde cero.
 *  Se llama después de cualquier cambio en pagos o novedades.
 *  Barre todos los pagos en orden cronológico y reasigna covered_days
 *  respetando días ya cubiertos, descanso y novedades. */
export async function recalcularCobertura(taxiPlate: string): Promise<void> {
  const taxi = await getTaxiByPlate(taxiPlate)
  if (!taxi) return

  const restDayIndex = DAY_INDEX[taxi.rest_day]
  const dailyTotal = taxi.daily_fee + taxi.daily_savings
  const unavail = await getAllUnavailabilityDates(taxiPlate)

  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount, date')
    .eq('taxi_plate', taxiPlate)
    .order('date', { ascending: true })
    .order('id', { ascending: true })

  if (!payments || payments.length === 0) {
    await recalcAccumulatedSavings(taxiPlate)
    return
  }

  const globalCovered = new Set<string>()

  for (const payment of payments) {
    const fullDays = Math.floor(payment.amount / dailyTotal)

    if (fullDays === 0) {
      await supabase.from('payments').update({ covered_days: [payment.date] }).eq('id', payment.id)
      globalCovered.add(payment.date)
      continue
    }

    const newCovered: string[] = []
    let remaining = fullDays
    const current = new Date(COVERAGE_START)
    const maxDate = new Date(current)
    maxDate.setFullYear(maxDate.getFullYear() + 10)

    while (remaining > 0 && current <= maxDate) {
      const dateStr = current.toISOString().slice(0, 10)
      const dayOfWeek = current.getDay()

      if (
        dayOfWeek !== restDayIndex &&
        !unavail.has(dateStr) &&
        !globalCovered.has(dateStr)
      ) {
        newCovered.push(dateStr)
        remaining--
      }
      current.setDate(current.getDate() + 1)
    }

    const finalCovered = newCovered.length > 0 ? newCovered : [payment.date]
    await supabase.from('payments').update({ covered_days: finalCovered }).eq('id', payment.id)
    for (const d of finalCovered) globalCovered.add(d)
  }

  await recalcAccumulatedSavings(taxiPlate)
}

/** Fecha desde la que se empieza a contar la deuda */
export const COVERAGE_START = '2026-06-01'

/** Calcula cobertura SECUENCIAL: cubre los días vencidos más antiguos primero */
export function calculateSequentialCoverage(
  amount: number,
  existingCovered: Set<string>,
  restDayIndex: number,
  dailyTotal: number,
): string[] {
  const fullDays = Math.floor(amount / dailyTotal)
  if (fullDays === 0) return []

  const covered: string[] = []
  let remaining = fullDays

  const current = new Date(COVERAGE_START)
  const maxDate = new Date(current)
  maxDate.setFullYear(maxDate.getFullYear() + 10)

  while (remaining > 0 && current <= maxDate) {
    const dateStr = current.toISOString().slice(0, 10)
    const dayOfWeek = current.getDay()

    if (dayOfWeek !== restDayIndex && !existingCovered.has(dateStr)) {
      covered.push(dateStr)
      remaining--
    }
    current.setDate(current.getDate() + 1)
  }
  return covered
}

async function recalcAccumulatedSavings(taxiPlate: string): Promise<void> {
  const taxi = await getTaxiByPlate(taxiPlate)
  if (!taxi) return
  const { data: allPayments } = await supabase
    .from('payments')
    .select('covered_days')
    .eq('taxi_plate', taxiPlate)
  let totalDays = 0
  if (allPayments) {
    for (const p of allPayments) {
      if (p.covered_days && Array.isArray(p.covered_days)) {
        totalDays += p.covered_days.length
      }
    }
  }
  const totalSavings = taxi.daily_savings * totalDays
  await supabase.from('taxis').update({ accumulated_savings: totalSavings }).eq('plate', taxiPlate)
}

async function getTaxiByPlate(plate: string): Promise<Taxi | null> {
  const { data } = await supabase.from('taxis').select('*').eq('plate', plate).single()
  return data
}

async function saveSavingsEntry(taxiPlate: string, amount: number, date: string, reason: string): Promise<void> {
  await supabase.from('savings_history').insert({ taxi_plate: taxiPlate, amount, date, reason })
}

/* ─── Taxis ─── */

export function useTaxis() {
  const [taxis, setTaxis] = useState<Taxi[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('taxis').select('*').order('plate')
    if (data) setTaxis(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const addTaxi = useCallback(async (t: Omit<Taxi, 'id' | 'created_at' | 'accumulated_savings'>) => {
    const { error } = await supabase.from('taxis').insert({ ...t, accumulated_savings: 0 })
    if (error) throw error
    await fetch()
  }, [fetch])

  const updateTaxi = useCallback(async (id: number, changes: Partial<Taxi>) => {
    const { error } = await supabase.from('taxis').update(changes).eq('id', id)
    if (error) throw error
    await fetch()
  }, [fetch])

  const deleteTaxi = useCallback(async (id: number) => {
    const { error } = await supabase.from('taxis').delete().eq('id', id)
    if (error) throw error
    await fetch()
  }, [fetch])

  return { taxis, loading, addTaxi, updateTaxi, deleteTaxi, refetch: fetch }
}

/* ─── Savings History ─── */

export function useSavingsHistory(taxiPlate?: string) {
  const [entries, setEntries] = useState<SavingsEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    let query = supabase.from('savings_history').select('*').order('date', { ascending: false })
    if (taxiPlate) query = query.eq('taxi_plate', taxiPlate)
    const { data } = await query
    if (data) setEntries(data)
    setLoading(false)
  }, [taxiPlate])

  useEffect(() => { fetch() }, [fetch])

  return { entries, loading, refetch: fetch }
}

/* ─── Payments ─── */

export function usePayments(taxiPlate?: string, month?: string, refreshKey?: number) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    let query = supabase.from('payments').select('*').order('date', { ascending: false })
    if (taxiPlate) query = query.eq('taxi_plate', taxiPlate)
    if (taxiPlate && month) {
      const start = `${month}-01`
      const end = `${month}-31`
      query = query.gte('date', start).lte('date', end)
    }
    const { data } = await query
    if (data) setPayments(data)
    setLoading(false)
  }, [taxiPlate, month, refreshKey])

  useEffect(() => { fetch() }, [fetch])

  const registerPayment = useCallback(async (p: Omit<Payment, 'id' | 'created_at'>) => {
    // Check duplicate
    const { data: existing } = await supabase
      .from('payments')
      .select('id')
      .eq('taxi_plate', p.taxi_plate)
      .eq('date', p.date)
      .maybeSingle()
    if (existing) throw new Error('DUPLICATE_PAYMENT')

    const taxi = await getTaxiByPlate(p.taxi_plate)
    if (!taxi) throw new Error('TAXI_NOT_FOUND')

    const dailyTotal = taxi.daily_fee + taxi.daily_savings
    if (dailyTotal <= 0) throw new Error('INVALID_DAILY_TOTAL')

    // Insert con covered_days vacío — recalcularCobertura lo llena después
    const { error } = await supabase.from('payments').insert({
      taxi_plate: p.taxi_plate,
      amount: p.amount,
      date: p.date,
      covered_days: [],
    })
    if (error) throw error

    // Recalcular toda la cobertura desde cero
    await recalcularCobertura(p.taxi_plate)

    // Registrar entrada de ahorros
    await saveSavingsEntry(p.taxi_plate, 1, p.date,
      `Pago de $${p.amount.toLocaleString('es-CO')}`)

    await fetch()
  }, [fetch])

  const deletePayment = useCallback(async (paymentId: number) => {
    const { data: payment } = await supabase.from('payments').select('taxi_plate, amount, date').eq('id', paymentId).single()
    if (!payment) throw new Error('PAYMENT_NOT_FOUND')

    const plate = payment.taxi_plate
    await supabase.from('payments').delete().eq('id', paymentId)

    await recalcularCobertura(plate)

    await saveSavingsEntry(plate, 0, payment.date,
      `Eliminación de pago de $${payment.amount.toLocaleString('es-CO')}`)

    await fetch()
  }, [fetch])

  const updatePayment = useCallback(async (paymentId: number, newData: { taxi_plate?: string; amount?: number; date?: string }) => {
    const { data: payment } = await supabase.from('payments').select('*').eq('id', paymentId).single()
    if (!payment) throw new Error('PAYMENT_NOT_FOUND')

    const taxi = await getTaxiByPlate(payment.taxi_plate)
    await supabase.from('payments').delete().eq('id', paymentId)

    if (taxi) {
      await recalcAccumulatedSavings(taxi.plate)
      await saveSavingsEntry(taxi.plate,
        -(taxi.daily_savings * (payment.covered_days?.length ?? 1)),
        payment.date, 'Edición de pago anterior')
    }

    await registerPayment({
      taxi_plate: newData.taxi_plate ?? payment.taxi_plate,
      amount: newData.amount ?? payment.amount,
      date: newData.date ?? payment.date,
      covered_days: [],
    })
  }, [registerPayment])

  const getCoverageForMonth = useCallback(async (taxiPlate: string, yearMonth: string): Promise<DayCoverage[]> => {
    const [year, m] = yearMonth.split('-').map(Number)
    const daysInMonth = getDaysInMonth(year, m)

    const taxi = await getTaxiByPlate(taxiPlate)
    if (!taxi) return []

    const restDayIndex = DAY_INDEX[taxi.rest_day]
    const existingCovered = await getAllCoveredDates(taxiPlate)
    const unavail = await getAllUnavailabilityDates(taxiPlate)
    const today = new Date().toISOString().slice(0, 10)
    const result: DayCoverage[] = []

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${yearMonth}-${String(day).padStart(2, '0')}`
      const dateObj = new Date(year, m - 1, day)
      let status: DayCoverage['status']
      let unavailabilityReason: string | undefined

      if (dateObj.getDay() === restDayIndex) {
        status = 'rest'
      } else if (unavail.has(dateStr)) {
        status = 'unavailability'
        unavailabilityReason = unavail.get(dateStr)
      } else if (existingCovered.has(dateStr)) {
        status = 'paid'
      } else if (dateStr > today) {
        status = 'future'
      } else {
        status = 'overdue'
      }
      result.push({ date: dateStr, day, status, unavailabilityReason })
    }
    return result
  }, [])

  const getMonthlySummary = useCallback(async (taxiPlate: string, yearMonth: string) => {
    const [year, m] = yearMonth.split('-').map(Number)
    const daysInMonth = getDaysInMonth(year, m)

    const taxi = await getTaxiByPlate(taxiPlate)
    if (!taxi) return { paidDays: 0, totalAmount: 0, totalDays: 0, overdueDays: 0, restDays: 0, unavailabilityDays: 0 }

    const restDayIndex = DAY_INDEX[taxi.rest_day]
    const existingCovered = await getAllCoveredDates(taxiPlate)
    const unavail = await getAllUnavailabilityDates(taxiPlate)
    const today = new Date().toISOString().slice(0, 10)

    let paidDays = 0, restDays = 0, overdueDays = 0, unavailabilityDays = 0
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${yearMonth}-${String(day).padStart(2, '0')}`
      const dateObj = new Date(year, m - 1, day)
      if (dateObj.getDay() === restDayIndex) { restDays++; continue }
      if (unavail.has(dateStr)) { unavailabilityDays++; continue }
      if (existingCovered.has(dateStr)) { paidDays++; continue }
      if (dateStr <= today) overdueDays++
    }

    const start = `${yearMonth}-01`
    const end = `${yearMonth}-${daysInMonth}`
    const { data: monthPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('taxi_plate', taxiPlate)
      .gte('date', start)
      .lte('date', end)
    const totalAmount = (monthPayments ?? []).reduce((sum, p) => sum + p.amount, 0)
    const totalDays = daysInMonth - restDays - unavailabilityDays

    return { paidDays, totalAmount, totalDays, overdueDays, restDays, unavailabilityDays }
  }, [])

  return {
    payments, loading,
    registerPayment, deletePayment, updatePayment,
    getCoverageForMonth, getMonthlySummary,
    refetch: fetch,
  }
}

/* ─── Unavailability (taller, incapacidad, feriado) ─── */

export function useUnavailability(taxiPlate?: string) {
  const [unavailability, setUnavailability] = useState<Unavailability[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    let query = supabase.from('unavailability').select('*').order('date', { ascending: false })
    if (taxiPlate) query = query.eq('taxi_plate', taxiPlate)
    const { data } = await query
    if (data) setUnavailability(data)
    setLoading(false)
  }, [taxiPlate])

  useEffect(() => { fetch() }, [fetch])

  const addUnavailability = useCallback(async (plate: string, date: string, reason: string) => {
    const { error } = await supabase.from('unavailability').insert({ taxi_plate: plate, date, reason })
    if (error) throw error
    await recalcularCobertura(plate)
    await fetch()
  }, [fetch])

  const removeUnavailability = useCallback(async (plate: string, date: string) => {
    await supabase.from('unavailability').delete().eq('taxi_plate', plate).eq('date', date)
    await recalcularCobertura(plate)
    await fetch()
  }, [fetch])

  return { unavailability, loading, addUnavailability, removeUnavailability, refetch: fetch }
}

/* ─── Insurance ─── */

export function useInsurances() {
  const [insurances, setInsurances] = useState<Insurance[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('insurances').select('*').order('expiry_date')
    if (data) setInsurances(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const addInsurance = useCallback(async (ins: Omit<Insurance, 'id' | 'created_at'>) => {
    const { error } = await supabase.from('insurances').insert(ins)
    if (error) throw error
    await fetch()
  }, [fetch])

  const updateInsurance = useCallback(async (id: number, changes: Partial<Insurance>) => {
    await supabase.from('insurances').update(changes).eq('id', id)
    await fetch()
  }, [fetch])

  const deleteInsurance = useCallback(async (id: number) => {
    await supabase.from('insurances').delete().eq('id', id)
    await fetch()
  }, [fetch])

  const renewInsurance = useCallback(async (id: number) => {
    const { data: existing } = await supabase.from('insurances').select('*').eq('id', id).single()
    if (!existing) return
    await supabase.from('insurances').update({ renewed: true }).eq('id', id)
    const newExpiry = new Date()
    newExpiry.setFullYear(newExpiry.getFullYear() + 1)
    await supabase.from('insurances').insert({
      taxi_plate: existing.taxi_plate,
      type: existing.type,
      issue_date: new Date().toISOString().slice(0, 10),
      expiry_date: newExpiry.toISOString().slice(0, 10),
      renewed: false,
    })
    await fetch()
  }, [fetch])

  return { insurances, loading, addInsurance, updateInsurance, deleteInsurance, renewInsurance, refetch: fetch }
}

/* ─── Alerts ─── */

function getAlertLevel(daysRemaining: number): AlertLevel {
  if (daysRemaining <= 7) return 'critical'
  if (daysRemaining <= 30) return 'warning'
  return 'ok'
}

export function useExpiryAlerts(): ExpiryAlert[] {
  const [alerts, setAlerts] = useState<ExpiryAlert[]>([])

  useEffect(() => {
    const fetch = async () => {
      const { data: insurances } = await supabase.from('insurances').select('*').eq('renewed', false)
      if (!insurances) return
      const today = new Date()
      const result = insurances.map((ins) => {
        const expiry = new Date(ins.expiry_date)
        const daysRemaining = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return {
          insuranceId: ins.id,
          taxiPlate: ins.taxi_plate,
          type: ins.type as ExpiryAlert['type'],
          expiryDate: ins.expiry_date,
          daysRemaining,
          level: getAlertLevel(daysRemaining),
        }
      }).sort((a, b) => a.daysRemaining - b.daysRemaining)
      setAlerts(result)
    }
    fetch()
    const interval = setInterval(fetch, 60000)
    return () => clearInterval(interval)
  }, [])

  return alerts
}

export function useDashboardStats() {
  const [stats, setStats] = useState({
    paidCount: 0,
    totalTaxis: 0,
    totalAmount: 0,
    pendingNames: [] as string[],
    criticalAlerts: [] as ExpiryAlert[],
  })

  useEffect(() => {
    const fetch = async () => {
      const today = new Date().toISOString().slice(0, 10)

      const [paymentsRes, taxisRes, insurancesRes] = await Promise.all([
        supabase.from('payments').select('taxi_plate, amount').eq('date', today),
        supabase.from('taxis').select('plate, driver_name'),
        supabase.from('insurances').select('*').eq('renewed', false),
      ])

      const todayPayments = paymentsRes.data ?? []
      const taxis = taxisRes.data ?? []
      const insurances = insurancesRes.data ?? []

      const paidPlates = new Set(todayPayments.map((p) => p.taxi_plate))
      const totalAmount = todayPayments.reduce((sum, p) => sum + p.amount, 0)
      const pendingNames = taxis
        .filter((t) => !paidPlates.has(t.plate))
        .map((t) => t.driver_name)

      const today_date = new Date()
      const criticalAlerts: ExpiryAlert[] = insurances
        .map((ins) => {
          const expiry = new Date(ins.expiry_date)
          const daysRemaining = Math.ceil((expiry.getTime() - today_date.getTime()) / (1000 * 60 * 60 * 24))
          const level = daysRemaining <= 7 ? 'critical' as const : daysRemaining <= 30 ? 'warning' as const : 'ok' as const
          return {
            insuranceId: ins.id,
            taxiPlate: ins.taxi_plate,
            type: ins.type as ExpiryAlert['type'],
            expiryDate: ins.expiry_date,
            daysRemaining,
            level,
          }
        })
        .filter((a) => a.level === 'critical')

      setStats({
        paidCount: todayPayments.length,
        totalTaxis: taxis.length,
        totalAmount,
        pendingNames,
        criticalAlerts,
      })
    }
    fetch()
    const interval = setInterval(fetch, 30000)
    return () => clearInterval(interval)
  }, [])

  return stats
}
