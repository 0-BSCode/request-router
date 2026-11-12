# Spec Delta

## ADDED Requirements

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
