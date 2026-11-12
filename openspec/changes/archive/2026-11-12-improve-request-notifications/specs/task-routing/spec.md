# Spec Delta

## MODIFIED Requirements

### Requirement: Create tasks through a mock API

The system SHALL submit one task per routed item through the mock Tasks API, retaining the source message ID, channel, sender, English request details, original text, detected language, room, department, and review state. Successful responses SHALL include a task ID. The mock SHALL validate payloads and require its configured sandbox credential. Every task payload and result SHALL require `detectedLanguage`.

#### Scenario: Multiple items target one department

- **WHEN** late checkout and a complaint occur in the same message
- **THEN** two separate front-desk tasks are created with the same source message ID

#### Scenario: Invalid mock request

- **WHEN** a task API request has an invalid payload or incorrect credential
- **THEN** the API rejects it without reporting task creation

#### Scenario: Language metadata reaches the department task

- **WHEN** a Filipino message produces housekeeping and front-desk tasks
- **THEN** both payloads contain `detectedLanguage: fil`, English summaries, and unchanged original guest text

#### Scenario: Missing language metadata

- **WHEN** a mock task payload omits `detectedLanguage` or provides a value that fails the language contract
- **THEN** the API rejects that payload without reporting task creation

## ADDED Requirements

### Requirement: Use English summaries for department review

Every task SHALL have an English summary. Per-request review tasks SHALL retain English extracted details and a review reason. Whole-message review tasks SHALL use an English explanation of why staff review is needed and retain original guest text separately. If extraction fails, the task SHALL use `detectedLanguage: unknown`; a validated unsupported language SHALL retain its detected code without claiming a translation succeeded.

#### Scenario: Unsupported French message

- **WHEN** a validated extraction identifies French and the system creates a whole-message review task
- **THEN** the task targets front desk, retains `detectedLanguage: fr`, has an English explanation of unsupported-language review, and attaches the unchanged French message

#### Scenario: Failed extraction

- **WHEN** extraction fails or its output cannot be trusted
- **THEN** the front-desk task has an English extraction-failure explanation, `detectedLanguage: unknown`, and the original message rather than a claimed translation

#### Scenario: Known request without a room

- **WHEN** a Cebuano towel request has no resolvable room
- **THEN** the front-desk review task retains its English request summary, null room, missing-room reason, original text, and `detectedLanguage: ceb`

#### Scenario: Other whole-message review reasons

- **WHEN** a message is referred for review because its language is uncertain or no actionable request was identified
- **THEN** the task uses an English explanation appropriate to that reason and preserves any trustworthy detected-language value and the original text
