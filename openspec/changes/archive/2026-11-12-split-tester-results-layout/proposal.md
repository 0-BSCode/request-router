# Proposal

## Why

On the tester at `/`, results render below the form, so reviewers scroll away from the message they submitted to read each outcome, and multi-task results become a long stack of cards. Showing input and results side by side on desktop, and letting reviewers switch between individual outcomes, makes comparing a message with its routing easier.

## What Changes

- On desktop widths, show the message form and the results next to each other in two columns, with the form staying in view while results scroll. Narrow screens keep the current stacked order: form first, then results.
- Before the first submission and while processing, the results column shows an empty-state or progress message instead of leaving blank space.
- Split results into two tabs: **Tasks**, which shows its task count, and **Guest reply**, which shows the acknowledgement.
- In the Tasks tab, add one chip per task attempt to switch between tasks, showing one task's details at a time. Chips are numbered and labelled with department and request type, so two tasks for the same department stay distinct, and they mark failed and needs-review tasks.
- Mark a failed acknowledgement on the Guest reply tab label, so failures are noticeable without opening every view.
- Widen the tester page and the navigation bar to fit two columns. The API reference page keeps its current reading width.
- **BREAKING (spec):** outcomes of one submission are no longer all on screen at once. Each outcome stays one selection away, and its status stays visible on its chip or tab.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `routing-test-ui`: change "Display end-to-end outcomes" so outcomes are reached through result tabs and task chips that show their statuses, instead of all being visible at once. Add a requirement for the responsive side-by-side tester layout.

## Impact

- `src/components/GuestMessageTester.tsx`: restructure the layout and results using the installed Radix `Tabs` from `radix-ui`, with existing tokens and `Badge` styling.
- `src/routes/index.tsx` and `src/components/Header.tsx`: page and navigation widths.
- README tester walkthrough.
- No changes to the API, processing, contracts, authentication, dependencies, or the `/reference` page.
