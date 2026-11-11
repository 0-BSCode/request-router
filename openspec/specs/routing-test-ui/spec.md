# routing-test-ui Specification

## Purpose

Let a tester exercise the real guest-message processing flow from one page and inspect its mock task and messaging outcomes.

## Requirements

### Requirement: Require sign-in for testing and processing

The tester SHALL use the workspace only with a valid session for the configured reviewer account. Visitors without an authorized session SHALL be directed to sign in. The processing endpoint SHALL independently reject missing, expired, or non-owner sessions with 401 before external calls.

#### Scenario: Unauthenticated workspace access

- **WHEN** a visitor opens `/app` without a valid session
- **THEN** the existing sign-in flow is used and the tester cannot be submitted

#### Scenario: Direct unauthenticated processing request

- **WHEN** the processing endpoint receives a request without a valid session
- **THEN** it returns 401 without calling OpenRouter or the mock APIs

#### Scenario: Session expires during testing

- **WHEN** a submission receives 401 because its session expired
- **THEN** the page explains that sign-in is required and offers the existing sign-in route

#### Scenario: Previously issued non-owner session

- **WHEN** a visitor uses a valid session belonging to an account other than the configured reviewer account
- **THEN** the workspace directs them to sign in and processing requests return 401 without calling OpenRouter or the mock APIs

#### Scenario: Authorized reviewer session

- **WHEN** a reviewer uses a valid session for the configured account
- **THEN** the workspace and processing flow remain available with their existing validation and mock behavior

### Requirement: Submit one guest message

The protected `/app` workspace SHALL provide a labelled channel selector for WhatsApp or email, an editable message textarea, and a Process message button. It SHALL generate a message ID and use a documented test sender. The room SHALL be extracted from the message rather than entered in a separate field.

#### Scenario: Manual message

- **WHEN** the tester submits a valid message with email selected
- **THEN** the server processes that text with email as the channel and the generated message ID and test sender

### Requirement: Load representative samples

The page SHALL offer editable sample messages sourced from the project's fixtures. Samples SHALL cover all four known request types, multiple requests, English, Filipino, Cebuano, mixed supported languages, unknown requests, unsupported language, and missing or ambiguous rooms.

#### Scenario: Edit a sample

- **WHEN** the tester loads a sample and edits its text before submission
- **THEN** the submitted text is the edited version and no processing happens merely from loading the sample

### Requirement: Show processing and validation state

The page SHALL reject blank or oversized input, disable duplicate submission while processing, announce progress and errors accessibly, and associate results with their submitted message. Starting a new submission SHALL clear the previous result.

#### Scenario: Submission in progress

- **WHEN** the tester submits a valid message
- **THEN** the button is disabled until processing settles and a processing indicator is shown

### Requirement: Display end-to-end outcomes

The page SHALL show each task attempt's request details, room or unknown-room marker, department, created or failed status, task ID when present, and review reason when present. It SHALL show acknowledgement text and delivery status and distinguish processing errors from partial API failures.

#### Scenario: Mixed outcomes

- **WHEN** processing returns a created task, a failed task attempt, and a failed acknowledgement delivery
- **THEN** all three outcomes remain visible with their respective statuses

### Requirement: Protect server configuration

The UI SHALL call the server-side processing flow and SHALL NOT receive OpenRouter or sandbox API credentials. It SHALL identify Tasks and Messaging results as mocks and present guest and model-derived text as text rather than executable markup.

#### Scenario: Mock processing succeeds

- **WHEN** a tester inspects the result of a successful run
- **THEN** the screen identifies task creation and acknowledgement delivery as mocked and exposes no API credential
