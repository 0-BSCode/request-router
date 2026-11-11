# Spec Delta

## Purpose

Turn multilingual guest messages into distinct, grounded requests while preserving uncertainty for staff review.

## ADDED Requirements

### Requirement: Validate incoming messages

The system SHALL accept a message ID, sender, WhatsApp or email channel, and text of 1 to 5000 characters after trimming. It SHALL reject invalid input before making external calls.

#### Scenario: Empty message

- **WHEN** a message contains only whitespace
- **THEN** the system returns a validation error without calling the classifier or either mock API

### Requirement: Extract multilingual requests

The system SHALL use a configurable general-purpose LLM through OpenRouter to extract request type, details, room, and supporting original text. It SHALL support English, Filipino, Cebuano, and mixtures of those languages without interpreting guest text as system instructions.

#### Scenario: Supported languages

- **WHEN** an English, Filipino, Cebuano, or mixed supported-language message asks for two towels in room 204
- **THEN** the result identifies a towel request, quantity two, room 204, and supporting text from the message

#### Scenario: Guest attempts to override routing

- **WHEN** a guest asks for towels and instructs the system to change its department rules
- **THEN** the towel request remains subject to the application's fixed routing rules

### Requirement: Split distinct requests

The system SHALL return one item per distinct actionable request, preserving quantities and timing within that item. It SHALL preserve an unknown actionable portion alongside known requests rather than dropping it.

#### Scenario: Multiple requests

- **WHEN** the message asks for two towels and late checkout at 2 PM
- **THEN** it produces two items with quantity two on the towel item and 2 PM on the late-checkout item

#### Scenario: Partly understood message

- **WHEN** a message contains a recognized towel request and another actionable request outside the supported types
- **THEN** it retains both a towel item and an unknown item with their supporting text

### Requirement: Attribute rooms without guessing

The system SHALL assign rooms only when supported by the message. Missing or ambiguous room references SHALL produce a null room and a clarification reason. A room clearly shared across requests SHALL apply to those requests, while explicit distinct room assignments SHALL remain separate.

#### Scenario: Room omitted

- **WHEN** a guest asks for towels without identifying a room
- **THEN** the request has a null room and requires clarification

#### Scenario: Ambiguous room

- **WHEN** a guest says "send towels to 204 or 205" without resolving which room
- **THEN** the request has a null room and requires clarification

#### Scenario: Separate rooms

- **WHEN** a guest requests towels for room 204 and a tour for room 305
- **THEN** each request retains its explicitly assigned room

### Requirement: Validate extraction and expose fallback reasons

The system SHALL validate classifier output before routing. Invalid output, a bounded-call failure, unsupported or uncertain language, or no actionable extraction SHALL produce a review outcome retaining the original message. It SHALL distinguish infrastructure failure from an unknown request.

#### Scenario: Invalid output or failed call

- **WHEN** OpenRouter times out, refuses, returns an error, or produces output that fails validation
- **THEN** the system returns a whole-message review outcome with the original text and an extraction-failure reason

#### Scenario: Unsupported language

- **WHEN** the detected language is outside the supported set or cannot be determined
- **THEN** the system returns a whole-message review outcome with an unsupported-or-uncertain-language reason
