# Spec Delta

## Purpose

Provide one privately configured reviewer account for the assessment demo, with repeatable startup and no public registration.

## ADDED Requirements

### Requirement: Initialize one configured account

The system SHALL create exactly one password account on an empty database before accepting requests. `OWNER_EMAIL` SHALL be a valid email normalized by trimming whitespace and lowercasing. The initial `OWNER_PASSWORD` SHALL contain 8 to 128 characters and SHALL be stored only as a password hash, preserving the supplied password exactly.

#### Scenario: First startup

- **WHEN** the database is empty and valid owner settings are supplied
- **THEN** startup creates one complete account that can sign in with the supplied credentials

#### Scenario: Invalid initialization settings

- **WHEN** the email is invalid or the initial password is missing or outside the permitted length
- **THEN** startup fails without creating a partial account or printing credentials

#### Scenario: Concurrent first starts

- **WHEN** multiple instances initialize the same empty database concurrently
- **THEN** exactly one complete account is created and all successful instances use it

### Requirement: Preserve the existing account

On subsequent starts, the system SHALL require the configured email to match the database's sole user with complete password credentials. It SHALL preserve credentials and sessions without requiring the initial password. A changed `OWNER_PASSWORD` SHALL NOT reset the stored password. Unexpected account state SHALL fail startup without modifying account data.

#### Scenario: Normal restart

- **WHEN** the configured account already exists and the initial password is removed or changed
- **THEN** its existing password and sessions remain valid and no additional account is created

#### Scenario: Unexpected database state

- **WHEN** the database contains another owner, multiple users, or incomplete password credentials
- **THEN** startup fails with an actionable message and leaves the account data untouched

### Requirement: Disable public registration

The application SHALL reject public registration through its auth API, return 404 for `/sign-up`, and display no account-creation form or registration links.

#### Scenario: Direct registration request

- **WHEN** a visitor submits a registration request against either an empty or initialized database
- **THEN** it is rejected without creating an account or session

#### Scenario: Registration page

- **WHEN** a visitor opens `/sign-up` or views the sign-in page
- **THEN** `/sign-up` returns 404 and the sign-in page offers no registration action

### Requirement: Restrict sessions to the configured account

Only the configured account SHALL be permitted to establish an application session. Access checks SHALL reject existing sessions belonging to any other user, and missing or invalid owner configuration SHALL deny protected access. Separate browsers SHALL be able to sign in concurrently using the shared credentials; signing out SHALL invalidate the session being signed out.

#### Scenario: Shared reviewer credentials

- **WHEN** reviewers sign in from separate browsers with the configured credentials
- **THEN** each obtains a session and one browser signing out does not terminate the other browser's session

#### Scenario: Wrong credentials or non-owner

- **WHEN** a user supplies an incorrect password, another account's credentials, or an existing non-owner session
- **THEN** the application denies authentication or protected access as appropriate

### Requirement: Supply private owner settings during deployment

The deployment helper SHALL validate required owner initialization settings before creating remote resources and forward them as literal runtime-only values from its private input file. Builds SHALL NOT require owner credentials. Setup-only mode SHALL continue to leave resources stopped, while explicit deployment SHALL initialize the account after migrations and before serving requests.

#### Scenario: Invalid deployment inputs

- **WHEN** setup is invoked without a valid owner email and initial password
- **THEN** it fails before creating any Coolify resources without printing the password

#### Scenario: Valid setup

- **WHEN** setup receives valid owner settings in the private deployment input file
- **THEN** it synchronizes them without using build arguments or exposing secrets in logs, and honors the selected setup-only or deployment mode
