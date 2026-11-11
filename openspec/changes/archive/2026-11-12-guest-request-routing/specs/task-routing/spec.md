# Spec Delta

## Purpose

Create department tasks from understood requests and preserve uncertain work for front-desk review with explicit creation outcomes.

## ADDED Requirements

### Requirement: Apply fixed department rules

The system SHALL route towels to housekeeping, late checkout and complaints to front desk, and tours to concierge. The classifier SHALL NOT choose or override departments.

#### Scenario: Known request categories

- **WHEN** requests for towels, late checkout, a complaint, and a tour have clear room assignments
- **THEN** their tasks target housekeeping, front desk, front desk, and concierge respectively

### Requirement: Route uncertainty to front desk

The system SHALL create a front-desk task marked needs review for each unknown request or request with a missing or ambiguous room. Whole-message review outcomes SHALL create one front-desk review task. Review tasks SHALL preserve the original message and review reason; unresolved rooms SHALL remain null.

#### Scenario: Known and unknown portions

- **WHEN** a message contains a towel request for room 204 and an unknown request
- **THEN** the towel task goes to housekeeping and the unknown request goes to front desk for review

#### Scenario: Missing room

- **WHEN** a towel request has no resolvable room
- **THEN** a front-desk review task is created with a null room instead of a housekeeping task

#### Scenario: Extraction failure

- **WHEN** extraction produces a whole-message review outcome
- **THEN** one front-desk review task contains the original message and the extraction-failure reason

### Requirement: Create tasks through a mock API

The system SHALL submit one task per routed item through the mock Tasks API, retaining the source message ID, channel, sender, request details, original text, room, department, and review state. Successful responses SHALL include a task ID. The mock SHALL validate payloads and require its configured sandbox credential.

#### Scenario: Multiple items target one department

- **WHEN** late checkout and a complaint occur in the same message
- **THEN** two separate front-desk tasks are created with the same source message ID

#### Scenario: Invalid mock request

- **WHEN** a task API request has an invalid payload or incorrect credential
- **THEN** the API rejects it without reporting task creation

### Requirement: Preserve per-task failures

The system SHALL record each task attempt as created or failed, continue processing other items after an individual failure, and retain successful task IDs. It SHALL NOT automatically retry task creation or roll back successful tasks.

#### Scenario: Partial failure

- **WHEN** one of two task creation calls fails
- **THEN** the result contains one created task with its ID and one failed attempt with a safe error description
