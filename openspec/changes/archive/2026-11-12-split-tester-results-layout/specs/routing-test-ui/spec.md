# Spec Delta

## MODIFIED Requirements

### Requirement: Display end-to-end outcomes

The page SHALL show each task attempt's English summary, detected language, derived language support, room or unknown-room marker, department, created or failed status, task ID when present, and review reason when present. Original evidence SHALL remain accessible. It SHALL show exact acknowledgement text and delivery status and distinguish processing errors from partial API failures. Tabs and task chips SHALL reach every outcome and mark failed or review-required ones without opening them.

#### Scenario: Mixed outcomes

- **WHEN** processing returns a created task, a failed task attempt, and a failed acknowledgement delivery
- **THEN** the failed task's chip and the Guest reply tab indicate failure while another view is open, and selecting each chip or tab shows that outcome with its status

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

## ADDED Requirements

### Requirement: Side-by-side tester layout

On desktop widths, the tester SHALL show the message form and the results in two adjacent columns, with the form remaining in view while results scroll. On narrow screens it SHALL stack the form above the results without horizontal scrolling. Before the first submission and while processing, the results area SHALL show an empty-state or progress message.

#### Scenario: Desktop submission

- **WHEN** a reviewer submits a message on a desktop-width screen
- **THEN** the results appear beside the form, and the form remains visible while the reviewer scrolls through a long result

#### Scenario: Narrow screen

- **WHEN** a reviewer uses the tester on a phone-width screen
- **THEN** the results appear below the form and the page does not scroll horizontally

#### Scenario: Before the first submission

- **WHEN** a reviewer opens `/` and has not submitted yet
- **THEN** the results area explains that results will appear there after processing a message

### Requirement: Result tabs and task chips

Results SHALL be split into a Tasks tab showing the task-attempt count and a Guest reply tab, with Tasks selected for each new result. The Tasks tab SHALL offer one chip per task attempt, numbered and labelled with department and request type, and show the selected attempt; the first is selected initially. Tabs and chips SHALL be keyboard operable and expose their selected state to assistive technology.

#### Scenario: Several tasks for one department

- **WHEN** a submission creates two front-desk tasks
- **THEN** the Tasks tab shows a count of 2 and two distinctly numbered Front desk chips, and selecting each shows that task's details

#### Scenario: No task attempts

- **WHEN** a submission returns no task attempts
- **THEN** the Tasks tab shows a count of 0 and explains that no task was created, and the Guest reply tab still shows the acknowledgement

#### Scenario: New submission resets selection

- **WHEN** a reviewer views the Guest reply tab or a later chip and then submits another message
- **THEN** the new result opens on the Tasks tab with its first chip selected

#### Scenario: Keyboard use

- **WHEN** a keyboard user reaches the result tabs or task chips
- **THEN** they can move between them with arrow keys, and the selected tab or chip is announced as selected
