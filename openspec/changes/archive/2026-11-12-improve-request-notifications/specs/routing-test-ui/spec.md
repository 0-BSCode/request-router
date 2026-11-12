# Spec Delta

## MODIFIED Requirements

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
