# Payments Specification

## Purpose

Record and track daily payments made by each driver. Each driver pays a fixed daily fee (cuota) for operating the taxi.

## Requirements

### Requirement: Register Daily Payment

The system MUST allow the administrator to register a payment for a specific driver on a specific date with a specific amount.

#### Scenario: Happy path — register today's payment

- GIVEN driver "Carlos Pérez" has a daily fee of $30,000
- WHEN the administrator selects Carlos and taps "Register Payment"
- THEN the system SHALL create a payment record for today's date with amount $30,000
- AND SHALL show "Payment registered ✓" with a green checkmark
- AND SHALL update the dashboard summary

#### Scenario: Marking a past date

- GIVEN today is 2026-06-24
- WHEN the administrator registers a payment for 2026-06-22
- THEN the system SHALL save it with the past date
- AND SHALL show a note "Payment registered for a past date"

### Requirement: Prevent Duplicate Payments

The system MUST NOT allow registering two payments for the same driver on the same date.

#### Scenario: Duplicate prevented

- GIVEN Carlos already paid for 2026-06-24
- WHEN the administrator tries to register another payment for Carlos on 2026-06-24
- THEN the system SHALL show "Carlos already paid for this day"
- AND SHALL NOT create a duplicate record

### Requirement: Payment History

The system MUST display a payment history view, filterable by driver and date range.

#### Scenario: View driver history

- GIVEN Carlos has 15 payment records
- WHEN the administrator selects Carlos in the filter
- THEN the system SHALL show only Carlos's payments, sorted newest first
- WITH date, amount, and a "Paid" badge per row

#### Scenario: Filter by month

- GIVEN there are payments across 3 months
- WHEN the administrator selects "June 2026" as the filter
- THEN the system SHALL show only June's payments

### Requirement: Monthly Summary

The system MUST show a monthly total for each driver: total paid days, total amount, and missing days.

#### Scenario: Monthly overview

- GIVEN June has 30 days, Carlos has 26 paid days
- WHEN the administrator views the monthly summary for Carlos
- THEN the system SHALL show "26 of 30 days — $780,000 total — 4 missing days"

### Requirement: Daily Fee Per Taxi

Each taxi's daily fee MUST be configurable and the payment amount pre-fills from the taxi assigned to the driver.

#### Scenario: Different fees per taxi

- GIVEN Taxi "ABC123" (driven by Carlos) has daily fee $30,000 and taxi "XYZ789" (driven by María) has daily fee $35,000
- WHEN registering a payment for Carlos
- THEN the amount pre-fills as $30,000 (from his taxi)
- AND the administrator MAY override the amount before saving

#### Scenario: No taxi assigned

- GIVEN a driver has no taxi assigned
- WHEN registering a payment for that driver
- THEN the amount field SHALL be empty
- AND the system SHALL show "No taxi assigned — enter amount manually"
