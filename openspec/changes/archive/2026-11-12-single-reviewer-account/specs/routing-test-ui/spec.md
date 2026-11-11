# Spec Delta

## MODIFIED Requirements

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
