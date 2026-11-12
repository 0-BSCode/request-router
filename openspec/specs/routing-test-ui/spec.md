# routing-test-ui Specification

## Purpose

Let a tester exercise the real guest-message processing flow from one page and inspect its mock task and messaging outcomes.

## Requirements

### Requirement: Require sign-in for testing and processing

The tester SHALL use the workspace only with a valid session for the configured reviewer account. Visitors without an authorized session SHALL be directed to sign in. The processing endpoint SHALL independently reject missing, expired, or non-owner sessions with 401 before external calls.

#### Scenario: Unauthenticated workspace access

- **WHEN** a visitor opens `/` without a valid session
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

The protected `/` workspace SHALL provide a labelled channel selector for WhatsApp or email, an editable message textarea, and a Process message button. It SHALL generate a message ID and use a documented test sender. The room SHALL be extracted from the message rather than entered in a separate field.

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

The page SHALL show each task attempt's English summary, detected language, derived language support, room or unknown-room marker, department, created or failed status, task ID when present, and review reason when present. Original evidence SHALL remain accessible. It SHALL show exact acknowledgement text and delivery status and distinguish processing errors from partial API failures.

#### Scenario: Mixed outcomes

- **WHEN** processing returns a created task, a failed task attempt, and a failed acknowledgement delivery
- **THEN** all three outcomes remain visible with their respective statuses

#### Scenario: Supported detected language

- **WHEN** a Filipino message creates a department task
- **THEN** the task displays an English summary, a readable Filipino language label, supported status, and unchanged original evidence

#### Scenario: Unsupported detected language

- **WHEN** a French message creates a front-desk review task
- **THEN** the task displays French and Unsupported alongside its English review explanation

#### Scenario: Unknown or mixed language

- **WHEN** a task carries `detectedLanguage: unknown` or `detectedLanguage: mixed`
- **THEN** the UI shows Unknown with review-required language status, or Mixed supported languages with an English-reply indication, respectively

#### Scenario: Language name unavailable

- **WHEN** a valid detected-language code has no available display name
- **THEN** the UI displays the code and its derived support status without failing to render the task

### Requirement: Protect server configuration

The UI SHALL call the server-side processing flow and SHALL NOT receive OpenRouter or sandbox API credentials. It SHALL identify Tasks and Messaging results as mocks and present guest and model-derived text as text rather than executable markup.

#### Scenario: Mock processing succeeds

- **WHEN** a tester inspects the result of a successful run
- **THEN** the screen identifies task creation and acknowledgement delivery as mocked and exposes no API credential

### Requirement: Canonical workspace navigation

The application SHALL serve the workspace at `/` instead of a public landing page. Successful sign-in and visits to `/sign-in` with an authorized reviewer session SHALL lead to `/`. Signed-out visitors SHALL be able to use `/sign-in`. Workspace navigation SHALL NOT show obsolete Open workspace or Back home actions. Successful sign-out SHALL lead to `/sign-in` and subsequent protected access SHALL require authentication.

#### Scenario: Authorized root visit

- **WHEN** the configured reviewer opens `/` with a valid session
- **THEN** the guest-message tester is displayed directly without the former landing page or its extra navigation step

#### Scenario: Successful sign-in

- **WHEN** a reviewer successfully signs in at `/sign-in`
- **THEN** the application navigates to `/` and displays the workspace

#### Scenario: Already signed in

- **WHEN** a reviewer opens `/sign-in` with an authorized session
- **THEN** they are redirected to `/` without a redirect loop

#### Scenario: Signed-out sign-in page

- **WHEN** a visitor without an authorized session opens `/sign-in`
- **THEN** the login form remains accessible without redirecting them back to the protected root

#### Scenario: Sign-out

- **WHEN** a reviewer successfully signs out using either visible sign-out control
- **THEN** they reach `/sign-in` and opening `/` again cannot display the protected workspace without signing in

### Requirement: Preserve the legacy workspace link

The application SHALL redirect visits to `/app` to the canonical `/` workspace. Following that redirect SHALL enforce the same owner-only access rules as opening `/` directly, without serving a duplicate workspace.

#### Scenario: Existing signed-in bookmark

- **WHEN** an authorized reviewer opens an existing `/app` bookmark
- **THEN** they are redirected to `/` and can use the workspace

#### Scenario: Existing signed-out bookmark

- **WHEN** a signed-out visitor opens `/app`
- **THEN** they are redirected through `/` to `/sign-in` without seeing protected workspace content
