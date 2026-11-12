# Spec Delta

## MODIFIED Requirements

### Requirement: Extract multilingual requests

The system SHALL use a configurable general-purpose LLM through OpenRouter to extract request type, details, room, and supporting original text. It SHALL support English, Filipino, Cebuano, and mixtures of those languages without interpreting guest text as system instructions. Extracted request details SHALL be concise English summaries preserving intent, quantities, and timing; supporting excerpts SHALL retain their original language.

#### Scenario: Supported languages

- **WHEN** an English, Filipino, Cebuano, or mixed supported-language message asks for two towels in room 204
- **THEN** the result identifies a towel request, quantity two, room 204, and supporting text from the message

#### Scenario: Guest attempts to override routing

- **WHEN** a guest asks for towels and instructs the system to change its department rules
- **THEN** the towel request remains subject to the application's fixed routing rules

#### Scenario: English summary from a Filipino request

- **WHEN** a Filipino guest asks for two towels and late checkout at 2 PM for room 204
- **THEN** separate English summaries retain the quantity and time while verbatim evidence remains in Filipino

## ADDED Requirements

### Requirement: Report actual detected language

The system SHALL return message-level `detectedLanguage` identifying the actual language independently of routing support. It SHALL use `en`, `fil`, and `ceb` for supported languages, a language code such as `fr` for an identified unsupported language, `mixed` for supported-language mixtures with no dominant language, and `unknown` when detection is uncertain. Support SHALL be derived from policy rather than stored as another field.

#### Scenario: Identified unsupported language

- **WHEN** a guest message is identified as French
- **THEN** `detectedLanguage` is `fr` and the message continues to require front-desk review rather than automatic department dispatch

#### Scenario: Shared language metadata across requests

- **WHEN** one Cebuano message contains several requests
- **THEN** its message-level language is `ceb` and applies to every resulting task

#### Scenario: Supported mixture

- **WHEN** a message evenly mixes English and Filipino
- **THEN** `detectedLanguage` is `mixed`, its requests remain eligible for normal routing, and the reply language defaults to English

#### Scenario: Language cannot be established

- **WHEN** the model cannot determine the language reliably
- **THEN** `detectedLanguage` is `unknown` and the message requires review
