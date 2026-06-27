# Tasks: Nanytaxi — Initial Platform

## Review Workload Forecast

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: size-exception (approved by maintainer)
400-line budget risk: High

| Field | Value |
|-------|-------|
| Estimated changed lines | ~800-1200 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

### Suggested Work Units

| Unit | Goal | Scope |
|------|------|-------|
| 1 | Foundation (DB, types, layout) | schema, types, layout shell |
| 2 | Drivers + Taxis CRUD | 2 feature modules |
| 3 | Payments + Insurance | 2 feature modules + dashboard |

## Phase 1: Foundation

- [ ] 1.1 Scaffold Vite + React + TypeScript + Tailwind project
- [ ] 1.2 Create `src/db/schema.ts` — Dexie DB with all 4 tables + indexes
- [ ] 1.3 Create `src/types/index.ts` — interfaces for Driver, Taxi, Payment, Insurance
- [ ] 1.4 Create `src/db/hooks.ts` — custom hooks (useDrivers, useTaxis, usePayments, useInsurances, useExpiryAlerts)
- [ ] 1.5 Create layout shell: `Layout.tsx`, `NavBar.tsx` with 5 tabs
- [ ] 1.6 Create `src/shared/styles/globals.css` — oversized base styles
- [ ] 1.7 Create shared UI components: `Button`, `Card`, `Badge`, `Modal`, `FormField`

## Phase 2: Drivers + Taxis

- [ ] 2.1 Create `src/features/drivers/DriverList.tsx` — list with edit/delete actions
- [ ] 2.2 Create `src/features/drivers/DriverForm.tsx` — add/edit form with validation
- [ ] 2.3 Create `src/features/taxis/TaxiList.tsx` — list with accumulated savings
- [ ] 2.4 Create `src/features/taxis/TaxiForm.tsx` — add/edit form with daily fee + savings
- [ ] 2.5 Wire both modules into router

## Phase 3: Payments + Insurance + Dashboard

- [ ] 3.1 Create `src/features/payments/PaymentForm.tsx` — register payment (pre-fills from taxi fee)
- [ ] 3.2 Create `src/features/payments/PaymentList.tsx` — history with driver/date filters
- [ ] 3.3 Create `src/features/payments/MonthlySummary.tsx` — monthly totals per driver
- [ ] 3.4 Create `src/features/insurance/InsuranceList.tsx` — grouped by taxi, sorted by expiry
- [ ] 3.5 Create `src/features/insurance/InsuranceForm.tsx` — add/edit/renew insurance
- [ ] 3.6 Create `src/features/dashboard/Dashboard.tsx` — summary cards + alerts banner

## Phase 4: Polish

- [ ] 4.1 Verify all CRUD flows end-to-end
- [ ] 4.2 Test alert badge colors match thresholds (7d red, 30d yellow)
- [ ] 4.3 Add empty states for all lists
- [ ] 4.4 Final accessibility pass: font sizes, contrast, touch targets
