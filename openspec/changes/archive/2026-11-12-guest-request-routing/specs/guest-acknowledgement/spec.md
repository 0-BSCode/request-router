# Spec Delta

## Purpose

Give guests a template-based response that accurately reflects recorded work, review needs, and delivery status.

## ADDED Requirements

### Requirement: Render acknowledgements from actual outcomes

The system SHALL prepare one template acknowledgement per valid incoming message after all task attempts finish. It SHALL distinguish successfully routed requests, successfully recorded review items, and failed task attempts, without promising approval, completion, or delivery of a requested service.

#### Scenario: Successful late-checkout request

- **WHEN** the front-desk task is created for late checkout
- **THEN** the acknowledgement says the request was passed to front desk without saying late checkout is approved

#### Scenario: Partial or total task failure

- **WHEN** some or all task attempts fail
- **THEN** the acknowledgement confirms only created tasks and states that the remaining requests could not be recorded

### Requirement: Request room clarification

The acknowledgement SHALL ask the guest to provide or clarify the room when any request has a missing or ambiguous room. It SHALL claim front-desk review was recorded only if that review task was created.

#### Scenario: Missing room with successful review

- **WHEN** a null-room review task is created
- **THEN** the reply confirms review and asks for the room

#### Scenario: Missing room with failed review creation

- **WHEN** the null-room review task fails to create
- **THEN** the reply asks for the room and reports the recording failure without claiming review was recorded

### Requirement: Select supported-language templates

The system SHALL provide English, Filipino, and Cebuano templates and localized request labels. It SHALL select the detected dominant supported language, use English when no dominant supported language is known, and generate no acknowledgement text through an LLM.

#### Scenario: Supported and unsupported languages

- **WHEN** messages are identified as English, Filipino, Cebuano, or unsupported
- **THEN** replies use English, Filipino, Cebuano, or English templates respectively

### Requirement: Send through the mock Messaging API

The system SHALL attempt one acknowledgement through the mock Messaging API using the incoming message's channel and sender. The mock SHALL validate payloads, require its configured sandbox credential, and return a delivery ID on success. Results SHALL expose acknowledgement text and sent or failed status separately from task outcomes.

#### Scenario: Delivery succeeds

- **WHEN** the mock accepts an acknowledgement
- **THEN** the result includes its text, delivery ID, and sent status

#### Scenario: Delivery fails after task creation

- **WHEN** the mock Messaging API fails after tasks were created
- **THEN** those task results remain created and the acknowledgement is displayed with failed status and a safe error description
