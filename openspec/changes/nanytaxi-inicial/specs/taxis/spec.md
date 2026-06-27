# Taxis Specification

## Purpose

Manage the fleet of taxis. Each taxi has a license plate and a daily savings amount that accumulates for the driver.

## Requirements

### Requirement: List Taxis

The system MUST display all registered taxis in a list showing license plate, assigned driver, daily savings amount, and accumulated savings total.

#### Scenario: Happy path

- GIVEN there are 2 registered taxis
- WHEN the administrator navigates to the taxis section
- THEN the system SHALL list each taxi with plate, driver name, savings per day, and total accumulated

#### Scenario: Unassigned taxi

- GIVEN a taxi has no driver assigned
- WHEN viewing the taxi list
- THEN the driver field SHALL show "Unassigned" in gray text

### Requirement: Add Taxi

The system MUST allow registering a taxi with: license plate (required, unique), daily fee amount (required, numeric), daily savings amount (required, numeric), and optionally an assigned driver.

#### Scenario: Happy path — add taxi

- GIVEN the administrator taps "Add Taxi"
- WHEN they enter plate "ABC123", daily fee "$30,000", daily savings "$5,000", and assign driver "Carlos"
- AND tap "Save"
- THEN the system SHALL create the taxi
- AND SHALL show it in the list with initial accumulated savings of $0

#### Scenario: Duplicate plate

- GIVEN taxi "ABC123" already exists
- WHEN the administrator tries to add another taxi with plate "ABC123"
- THEN the system SHALL show "This plate is already registered"
- AND SHALL NOT save the duplicate

### Requirement: Daily Savings Accumulation

The system MUST automatically add the daily savings amount to accumulated savings each time a payment is registered for the taxi's driver.

#### Scenario: Savings accumulate on payment

- GIVEN taxi "ABC123" has daily savings of $5,000 and current accumulated savings of $50,000
- WHEN a daily payment of $30,000 is registered for its driver
- THEN the accumulated savings SHALL increase to $55,000

### Requirement: Edit and Delete Taxi

The system MUST allow editing taxi details and deleting a taxi with confirmation.

#### Scenario: Edit savings amount

- GIVEN taxi "ABC123" has daily savings of $5,000
- WHEN the administrator changes it to $6,000
- THEN future payments SHALL add $6,000 per day
- AND past accumulated savings SHALL NOT be recalculated

#### Scenario: Delete with confirmation

- GIVEN taxi "ABC123" exists
- WHEN the administrator taps "Delete"
- THEN the system SHALL ask "Delete taxi ABC123 and all its data?"
- AND only delete on explicit confirmation
