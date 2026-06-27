# Drivers Specification

## Purpose

Manage the list of drivers (motoristas) who operate the taxis. Each driver has personal details, an assigned license plate, and a chosen rest day.

## Requirements

### Requirement: List Drivers

The system MUST display all registered drivers in a simple list showing name, assigned plate, and rest day.

#### Scenario: Happy path — multiple drivers exist

- GIVEN there are 3 registered drivers
- WHEN the administrator navigates to the drivers section
- THEN the system SHALL display a list with each driver's name, plate, and rest day
- AND rows SHALL be tall and tappable (minimum 56px height)

#### Scenario: Empty list

- GIVEN no drivers have been registered yet
- WHEN the administrator navigates to the drivers section
- THEN the system SHALL display "No drivers yet" with a large "+ Add Driver" button

### Requirement: Add Driver

The system MUST allow the administrator to register a new driver with: name (required), assigned plate (required), and rest day (required, selected from a dropdown of 7 days).

#### Scenario: Happy path — add driver

- GIVEN the administrator taps the "Add Driver" button
- WHEN they enter "Carlos Pérez", plate "ABC123", and rest day "Sunday"
- AND they tap "Save"
- THEN the system SHALL save the driver and show them in the list
- AND SHALL show a brief success confirmation

#### Scenario: Missing required fields

- GIVEN the administrator tries to save a driver without a name
- WHEN they tap "Save"
- THEN the system SHALL NOT save
- AND SHALL highlight the empty required field in red with "This field is required"

### Requirement: Edit Driver

The system MUST allow editing all driver fields.

#### Scenario: Edit rest day

- GIVEN driver "Carlos Pérez" exists with rest day "Sunday"
- WHEN the administrator taps the driver row and changes rest day to "Monday"
- AND taps "Save"
- THEN the system SHALL update the driver's rest day
- AND SHALL reflect the change in the list

### Requirement: Delete Driver

The system MUST allow deleting a driver with a confirmation step to prevent accidental removal.

#### Scenario: Confirm before delete

- GIVEN driver "Carlos Pérez" exists
- WHEN the administrator taps "Delete"
- THEN the system SHALL show "Are you sure? This will also remove payment history for this driver."
- AND only delete after the administrator confirms

### Requirement: Rest Day Display

The system MUST clearly show each driver's rest day next to their name in the list, using a colored badge.

#### Scenario: Rest day visible

- GIVEN driver "Carlos" has rest day "Sunday"
- WHEN viewing the driver list
- THEN "Carlos" row SHALL show a badge with "Rest: Sunday"
- AND today's rest day drivers SHALL be visually distinct (e.g., grayed out)
