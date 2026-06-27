# Dashboard Specification

## Purpose

Provide the administrator with an at-a-glance overview of the business state: today's payments, upcoming insurance expiries, and active alerts.

## Requirements

### Requirement: Today's Payment Summary

The dashboard MUST display a summary of today's payments showing total collected amount and how many drivers have paid vs. pending.

#### Scenario: Happy path — some payments registered

- GIVEN there are 3 drivers and today's date is 2026-06-24
- WHEN the administrator opens the dashboard
- THEN the dashboard SHALL show "2 of 3 paid — $120,000 total"
- AND SHALL list the names of drivers who have not yet paid

#### Scenario: Empty state — no payments yet

- GIVEN today is a new day and no payments have been registered
- WHEN the administrator opens the dashboard
- THEN the dashboard SHALL show "$0 — No payments registered today"
- AND SHALL display a prominent button to register a payment

### Requirement: Upcoming Expiry Alerts

The dashboard MUST show insurance and document expiries sorted by nearest date, with visual distinction for critical (≤7 days) and warning (≤30 days) thresholds.

#### Scenario: Mixed expiry states

- GIVEN a SOAT expires in 5 days and a tecnomecánica expires in 20 days
- WHEN the administrator opens the dashboard
- THEN the SOAT SHALL appear with a RED badge "Expires in 5 days"
- AND the tecnomecánica SHALL appear with a YELLOW badge "Expires in 20 days"

#### Scenario: All insurances active

- GIVEN no insurance expires within the next 60 days
- WHEN the administrator opens the dashboard
- THEN the dashboard SHALL show "All insurances up to date ✓" with no expiry alerts

### Requirement: Quick-Action Buttons

The dashboard MUST provide 2 prominent buttons for the most common daily actions: "Register Payment" and "View Today's Activity".

#### Scenario: Quick action navigates correctly

- GIVEN the administrator is on the dashboard
- WHEN they tap "Register Payment"
- THEN the app SHALL navigate to the payments section with today's date pre-selected

### Requirement: Visual Alert for Critical Items

Any item in critical alert state (≤7 days to expiry, or overdue) SHALL use a full-width colored banner at the top of the dashboard.

#### Scenario: Overdue insurance

- GIVEN a contractual insurance expired 3 days ago
- WHEN the administrator opens the dashboard
- THEN a RED banner SHALL appear at the top: "⚠ CONTRACTUAL INSURANCE EXPIRED — 3 days overdue"
