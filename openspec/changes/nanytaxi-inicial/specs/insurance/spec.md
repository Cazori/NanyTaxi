# Insurance & Documents Specification

## Purpose

Track expiry dates of all required insurance policies and legal documents for each taxi. Alert the administrator well before each expiry.

## Requirements

### Requirement: Insurance Types

The system MUST support these insurance/document types for each taxi:

- SOAT (mandatory insurance)
- Tecnomecánica (vehicle inspection)
- Tarjeta de Operaciones (operating card)
- Impuestos (taxes)
- Seguro Contractual (contractual insurance)
- Seguro Extracontractual (extra-contractual insurance)

#### Scenario: All types available

- GIVEN the administrator is adding insurance for a taxi
- WHEN they tap "Add Insurance"
- THEN the system SHALL show exactly these 6 options in a picker

### Requirement: Register Insurance Record

The system MUST allow registering an insurance record with: taxi plate (required), type (required from the 6 types), issue date (required), expiry date (required), and optional notes.

#### Scenario: Happy path

- GIVEN taxi "ABC123" exists
- WHEN the administrator adds a SOAT with issue date 2026-01-01 and expiry 2026-12-31
- AND taps "Save"
- THEN the system SHALL create the record
- AND SHALL show it in the insurance list for that taxi

#### Scenario: Past expiry date

- GIVEN the administrator enters an expiry date in the past
- WHEN they try to save
- THEN the system SHALL warn "This insurance has already expired"
- AND SHALL still allow saving (for historical records)

### Requirement: Expiry Alert Thresholds

The system MUST automatically calculate days until expiry and assign an alert state:

- **Critical** (RED): ≤7 days or overdue
- **Warning** (YELLOW): 8–30 days
- **OK** (GREEN): >30 days

#### Scenario: Alert states display

- GIVEN SOAT expires in 5 days, tecnomecánica in 20 days, and tarjeta in 100 days
- WHEN viewing the insurance list
- THEN SOAT SHALL show a red "5 days left" badge
- AND tecnomecánica SHALL show a yellow "20 days left" badge
- AND tarjeta SHALL show a green "100 days left" badge

### Requirement: Insurance List View

The system MUST display all insurance records grouped by taxi, sorted by expiry date (nearest first).

#### Scenario: Grouped view

- GIVEN taxi ABC123 has 3 insurances with different dates and taxi XYZ789 has 2
- WHEN the administrator navigates to insurance
- THEN items SHALL be grouped under each taxi plate
- AND SHALL be ordered by expiry date ascending within each group

### Requirement: Edit and Renew Insurance

The system MUST allow editing an insurance record and marking it as renewed (which archives the old and creates a new record).

#### Scenario: Renew insurance

- GIVEN SOAT for ABC123 expires 2026-12-31
- WHEN the administrator taps "Renew"
- THEN the system SHALL archive the current record
- AND SHALL create a new record with the same type and plate, defaulting to next-day issue date

### Requirement: Overdue Highlighting

Any insurance past its expiry date MUST be highlighted with a red background and show "EXPIRED — X days overdue" in the list.

#### Scenario: Overdue insurance

- GIVEN a tax insurance expired 15 days ago
- WHEN viewing the insurance list
- THEN that tax record SHALL have a red background
- AND SHALL display "EXPIRED — 15 days overdue"
