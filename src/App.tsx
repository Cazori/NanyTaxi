import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './shared/ThemeContext'
import { ToastProvider } from './shared/Toast'
import { Layout } from './features/layout/Layout'
import { Dashboard } from './features/dashboard/Dashboard'
import { TaxiList } from './features/taxis/TaxiList'
import { PaymentList } from './features/payments/PaymentList'
import { InsuranceList } from './features/insurance/InsuranceList'

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/taxis" element={<TaxiList />} />
              <Route path="/payments" element={<PaymentList />} />
              <Route path="/insurance" element={<InsuranceList />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  )
}
