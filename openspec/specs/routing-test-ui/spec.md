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

- **WHEN** a reviewer successfully signs out using the sign-out button in the navigation bar
- **THEN** they reach `/sign-in` and opening `/` again cannot display the protected workspace without signing in

### Requirement: Preserve the legacy workspace link

The application SHALL redirect visits to `/app` to the canonical `/` workspace. Following that redirect SHALL enforce the same owner-only access rules as opening `/` directly, without serving a duplicate workspace.

#### Scenario: Existing signed-in bookmark

- **WHEN** an authorized reviewer opens an existing `/app` bookmark
- **THEN** they are redirected to `/` and can use the workspace

#### Scenario: Existing signed-out bookmark

- **WHEN** a signed-out visitor opens `/app`
- **THEN** they are redirected through `/` to `/sign-in` without seeing protected workspace content

### Requirement: Separate tester and API reference pages

The protected tester SHALL remain at `/`, and a static mock API reference SHALL be served at `/reference`. `/reference` SHALL enforce the same reviewer access check as `/`. Moving between the pages SHALL NOT submit or repeat a request. Leaving `/` SHALL reset the tester's input and results, as a reload does.

#### Scenario: Open the API reference

- **WHEN** an authorized reviewer opens `/reference`
- **THEN** the API reference is displayed and the tester is not

#### Scenario: Signed-out reference access

- **WHEN** a signed-out visitor opens `/reference`
- **THEN** they are redirected to `/sign-in` and the reference is not displayed

#### Scenario: Return to the tester

- **WHEN** a reviewer leaves `/` for `/reference` and returns
- **THEN** the tester shows its initial state and no processing or mock request was sent by the navigation

### Requirement: Navigation links between pages

For an authorized reviewer, the navigation bar SHALL list links to the tester (`/`) and the API reference (`/reference`). The links SHALL be reachable by keyboard and SHALL indicate the current page visually and to assistive technology. Signed-out visitors SHALL NOT be shown these links. The navigation bar SHALL remain usable on narrow screens.

#### Scenario: Current page indicated

- **WHEN** an authorized reviewer is on `/reference`
- **THEN** the API reference link is marked as the current page and the tester link is not

#### Scenario: Keyboard navigation

- **WHEN** a reviewer tabs to the API reference link and activates it with the keyboard
- **THEN** `/reference` opens

#### Scenario: Signed-out navigation bar

- **WHEN** a visitor without a session views `/sign-in`
- **THEN** no tester or API reference links are shown

### Requirement: Static mock API reference

The reference page SHALL display static, synthetic examples for `POST /api/mock/tasks` and `POST /api/mock/messages`. Each SHALL show JSON content type, bearer authentication with a placeholder key, a complete valid request body, a sample 201 response, and the meanings of 400, 401, and 503. Task examples SHALL include required detected-language metadata. Sample responses SHALL be identified as examples. Code examples SHALL remain readable on narrow screens.

#### Scenario: Inspect Tasks API

- **WHEN** a reviewer opens the Tasks API reference
- **THEN** it shows the endpoint, headers, a schema-valid task request including `detectedLanguage`, and an example response containing `taskId`

#### Scenario: Inspect Messaging API

- **WHEN** a reviewer opens the Messaging API reference
- **THEN** it shows the endpoint, headers, a schema-valid outgoing message request, and an example response containing `deliveryId`

#### Scenario: Understand errors

- **WHEN** a reviewer reads either endpoint reference
- **THEN** it explains 400 as invalid payload, 401 as invalid sandbox credential, and 503 as missing mock configuration

#### Scenario: Narrow viewport

- **WHEN** a reviewer opens an endpoint reference on a narrow screen
- **THEN** long JSON lines can be read through wrapping or local code-block scrolling without widening the page

### Requirement: Collapsible endpoint references

Each endpoint on the reference page SHALL be a separately collapsible section, collapsed on initial display. Its heading control SHALL expose the expanded state and be operable by keyboard. Collapsed content SHALL be hidden from view and keyboard navigation.

#### Scenario: Initial reference view

- **WHEN** a reviewer opens `/reference`
- **THEN** both endpoint headings are shown collapsed

#### Scenario: Expand and collapse an endpoint

- **WHEN** a reviewer activates an endpoint heading by pointer or keyboard
- **THEN** that endpoint's reference expands or collapses without changing the other endpoint, and its expanded state is announced

### Requirement: Keep API reference independent of tester submissions

The reference page SHALL explain that mock acceptance stores nothing and contacts no guest. Its examples SHALL remain independent of tester submissions and SHALL NOT display real configuration secrets, live request data, or submission history. Opening the reference page SHALL NOT call the processing or mock endpoints. It SHALL provide no request execution controls.

#### Scenario: Inspect reference before or after testing

- **WHEN** a reviewer opens `/reference` before or after processing a message in the tester
- **THEN** the same synthetic examples are shown without tester data or actual credentials and without calling a processing or mock endpoint
