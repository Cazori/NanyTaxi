# Design: Nanytaxi — Initial Platform

## Technical Approach

Single-page web application (React + TypeScript + Vite) with client-side persistence via IndexedDB (Dexie.js). No backend — all data lives in the browser. Five feature modules (dashboard, drivers, taxis, payments, insurance) share a common data layer.

## Architecture Decisions

### Decision: Client-side database with IndexedDB

| Option | Tradeoff | Decision |
|--------|----------|----------|
| localStorage | Simple but synchronous, 5–10MB limit, no queries | ❌ Rejected |
| **IndexedDB via Dexie.js** | Async, 50MB+ limit, queryable, relational-like | ✅ **Chosen** |
| SQLite via node | Requires native module or backend | ❌ Rejected |

**Rationale**: IndexedDB gives us a real queryable database in the browser. Dexie.js wraps it in a simple promise-based API with indexes and relations. Scales to thousands of records. Migration path to a real backend later is straightforward (replace Dexie calls with fetch).

### Decision: Feature-based folder structure

```
src/
├── features/
│   ├── dashboard/
│   ├── drivers/
│   ├── taxis/
│   ├── payments/
│   └── insurance/
├── shared/        # Reusable UI components, hooks, utils
├── db/            # Dexie schema, migrations, queries
└── types/         # Shared TypeScript types
```

**Rationale**: Each feature is self-contained (components, hooks, queries). Easy to navigate. Easy to extract to micro-frontends or a backend API later.

### Decision: No global state manager

| Option | Tradeoff | Decision |
|--------|----------|----------|
| React Context + hooks | Simple, built-in, sufficient for this scale | ✅ **Chosen** |
| Redux/Zustand | Overkill for 5 CRUD modules, 1 user | ❌ Rejected |
| TanStack Query | Great for server-state, overkill for local DB | ❌ Rejected |

**Rationale**: With a single user and local DB, React state + Dexie live queries are sufficient. Each feature module fetches its own data via custom hooks (`useDrivers`, `usePayments`, etc.). No need for global caching or synchronization.

### Decision: Component library — custom components, not a UI framework

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Custom Tailwind components** | Full control over sizing/contrrast/accessibility | ✅ **Chosen** |
| Material UI / Chakra | Heavy, harder to override for large-font accessibility | ❌ Rejected |
| Radix UI + Tailwind | Good accessibility primitives, more deps | ❌ Rejected |

**Rationale**: The app needs oversized UI — 20px+ fonts, 56px+ buttons, high contrast. A custom component set with Tailwind gives precise control over every pixel. Simpler dependency tree.

## Data Flow

```
User Action → Component → Custom Hook → Dexie (IndexedDB)
                                          │
                                     React Query / Live Query
                                          │
User sees ← Component ←── Hook returns data ──┘
```

All mutations follow: `user clicks → hook method (addDriver, registerPayment) → Dexie.put/add → hook re-fetches → component re-renders`.

## Database Schema

```
drivers:        id, name, plate, restDay, createdAt
taxis:          id, plate, assignedDriverId, dailyFee, dailySavings, accumulatedSavings, createdAt
payments:       id, driverId, amount, date, createdAt (unique index: [driverId+date])
insurances:     id, taxiPlate, type, issueDate, expiryDate, notes, renewed, createdAt
```

Dexie indexes on: `drivers.name`, `taxis.plate`, `payments.[driverId+date]`, `insurances.expiryDate`.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/main.tsx` | Create | React entry point |
| `src/App.tsx` | Create | Root component with router |
| `src/db/schema.ts` | Create | Dexie database definition |
| `src/db/hooks.ts` | Create | Custom hooks (useDrivers, usePayments, etc.) |
| `src/types/index.ts` | Create | Shared TypeScript interfaces |
| `src/features/layout/Layout.tsx` | Create | Bottom nav bar + content area shell |
| `src/features/layout/NavBar.tsx` | Create | 5-tab navigation bar |
| `src/features/dashboard/Dashboard.tsx` | Create | Summary view |
| `src/features/drivers/DriverList.tsx` | Create | Driver CRUD list |
| `src/features/drivers/DriverForm.tsx` | Create | Add/edit driver form |
| `src/features/taxis/TaxiList.tsx` | Create | Taxi CRUD list |
| `src/features/taxis/TaxiForm.tsx` | Create | Add/edit taxi form |
| `src/features/payments/PaymentList.tsx` | Create | Payment history view |
| `src/features/payments/PaymentForm.tsx` | Create | Register payment form |
| `src/features/insurance/InsuranceList.tsx` | Create | Insurance list grouped by taxi |
| `src/features/insurance/InsuranceForm.tsx` | Create | Add/edit insurance form |
| `src/shared/ui/Button.tsx` | Create | Oversized accessible button |
| `src/shared/ui/Card.tsx` | Create | Information card component |
| `src/shared/ui/Badge.tsx` | Create | Alert level badge |
| `src/shared/ui/Modal.tsx` | Create | Confirmation modal |
| `src/shared/styles/globals.css` | Create | Tailwind base + large-font overrides |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Custom hooks (database CRUD) | Vitest + fakeIndexedDB |
| Unit | Utility functions (date formatting, alerts) | Vitest |
| Component | Form validation, list rendering | Vitest + Testing Library |
| E2E | Full CRUD flows | Manual for v1 (no CI setup) |

## Migration / Rollout

No migration required — greenfield project. Data starts empty. First load creates the IndexedDB database automatically.

## Resolved Questions

- ✅ Daily fee is **per-taxi**, not per-driver. Schema updated: `taxis.dailyFee`.
- ✅ Taxi-driver relationship is **fixed** (one-to-one). No driver swapping modeled.
