# guest-acknowledgement Specification

## Purpose

Give guests a template-based response that accurately reflects recorded work, review needs, and delivery status.

## Requirements

### Requirement: Use readable guest-facing sentences

The acknowledgement SHALL use short natural sentences describing each request's actual outcome. It SHALL avoid bracketed room labels, parenthesized department labels, semicolon-separated task dumps, internal review codes, and repeated greetings. Relevant rooms SHALL be written naturally and remain distinguishable. Failure wording SHALL identify unrecorded requests and direct the guest to front desk for help without contradicting successful outcomes.

#### Scenario: Several successfully forwarded requests

- **WHEN** towels and late checkout for room 204 are recorded successfully
- **THEN** the reply uses readable sentences confirming the towel request was sent to housekeeping and the late-checkout request was passed to front desk for review, without claiming approval or fulfillment

#### Scenario: Different rooms

- **WHEN** successful requests concern rooms 204 and 305
- **THEN** the reply associates each request with its correct room using natural language

#### Scenario: Partial recording failure

- **WHEN** the towel task succeeds and the late-checkout task fails
- **THEN** the reply confirms only towel forwarding and separately explains that late checkout could not be passed on, with a suggestion to contact front desk

#### Scenario: No task was created

- **WHEN** every task attempt fails
- **THEN** the reply explains the failure and how to seek help without any successful-forwarding or review confirmation

#### Scenario: Generic front-desk review

- **WHEN** an unknown or unsupported message is successfully recorded for review
- **THEN** the reply naturally says the message was passed to front desk for review rather than exposing a label such as unknown request or an internal failure code

### Requirement: Render acknowledgements from actual outcomes

The system SHALL prepare one template acknowledgement per valid incoming message after all task attempts finish. It SHALL distinguish successfully routed requests, successfully recorded review items, and failed task attempts, without promising approval, completion, or delivery of a requested service.

#### Scenario: Successful late-checkout request

- **WHEN** the front-desk task is created for late checkout
- **THEN** the acknowledgement says the request was passed to front desk without saying late checkout is approved

#### Scenario: Partial or total task failure

- **WHEN** some or all task attempts fail
- **THEN** the acknowledgement confirms only created tasks and states that the remaining requests could not be recorded

### Requirement: Request room clarification

The acknowledgement SHALL use a short, direct question to request the room when it is missing or to resolve an ambiguous room. It SHALL claim front-desk review was recorded only if that review task was created. Clarification SHALL refer only to requests with unresolved rooms.

#### Scenario: Missing room with successful review

- **WHEN** a null-room review task is created
- **THEN** the reply confirms review and asks for the room

#### Scenario: Missing room with failed review creation

- **WHEN** the null-room review task fails to create
- **THEN** the reply asks for the room and reports the recording failure without claiming review was recorded

#### Scenario: Clear room alongside an unresolved room

- **WHEN** a message contains one request for room 204 and another with an ambiguous room
- **THEN** the reply asks which room applies to the unresolved request without implying room 204 was unknown

### Requirement: Select supported-language templates

The system SHALL provide English, Filipino, and Cebuano sentence templates selected from `detectedLanguage`. It SHALL use English for other language codes, `mixed`, and `unknown`, and generate no acknowledgement text through an LLM. English department summaries SHALL NOT be inserted into localized guest replies.

#### Scenario: Supported and unsupported languages

- **WHEN** messages are identified as English, Filipino, Cebuano, or unsupported
- **THEN** replies use English, Filipino, Cebuano, or English templates respectively

#### Scenario: Actual unsupported language code

- **WHEN** the detected language is `fr`
- **THEN** the guest receives an English template and no French template or automatic routing support is implied

#### Scenario: Supported mixture with a dominant language

- **WHEN** a supported-language mixture is detected with Filipino as its dominant language
- **THEN** the guest receives Filipino sentences while staff receive English summaries

### Requirement: Send through the mock Messaging API

The system SHALL attempt one acknowledgement through the mock Messaging API using the incoming message's channel and sender. The mock SHALL validate payloads, require its configured sandbox credential, and return a delivery ID on success. Results SHALL expose acknowledgement text and sent or failed status separately from task outcomes.

#### Scenario: Delivery succeeds

- **WHEN** the mock accepts an acknowledgement
- **THEN** the result includes its text, delivery ID, and sent status

#### Scenario: Delivery fails after task creation

- **WHEN** the mock Messaging API fails after tasks were created
- **THEN** those task results remain created and the acknowledgement is displayed with failed status and a safe error description
