# Design

## Context

See `proposal.md` for motivation and `specs/routing-test-ui/spec.md` for requirements. `GuestMessageTester` owns the form, the pending and error state, and the result, and renders the result as a stack of Cards below the form: an echo of the submitted message, an optional extraction error, one Card per task attempt, and one acknowledgement Card. `src/routes/index.tsx` and `src/routes/reference.tsx` wrap their pages in `max-w-3xl`. The navigation bar in `Header.tsx` uses `max-w-4xl`. Radix primitives come from the installed `radix-ui` package (the API reference already uses its `Accordion`). Tests run in a Node environment with no DOM renderer, and UI behavior has so far been verified in a browser.

## Goals / Non-Goals

**Goals:** Keep the existing per-task and acknowledgement content intact while changing how it is laid out and reached, using only installed primitives.

**Non-Goals:** New result fields, persisting the selected tab or chip, filtering or sorting tasks, a results history, changes to `/reference` content or width, or adding a DOM testing setup.

## Decisions

### Two columns from the `lg` breakpoint

Widen `/` to `max-w-6xl` and use a single-column grid that becomes two columns at `lg` (1024px), with the form in the narrower column and the results in the wider one, since task details hold more text. Below `lg`, the current stacked order stays. The form column is `lg:sticky` at the top so it stays visible while results scroll. In the form column, the Sample and Channel selects stack at `lg` and above, because half-width columns are too narrow for them side by side. The navigation bar widens to `max-w-6xl` so its edges line up with the tester. `/reference` stays at `max-w-3xl`, because code examples read better in a narrow column. `md` was considered and rejected: at 768px each column is too narrow for task details.

### The results column always has content

Before the first submission, the column shows a short placeholder. While processing, it shows the progress text. The existing `role="status"` live region and the form's `role="alert"` errors stay where they are, so announcements don't change. The submitted-message echo and any extraction error stay above the tabs, because they apply to the whole submission.

### Radix `Tabs` for both tab levels

Use `Tabs` from `radix-ui` for the Tasks / Guest reply tabs and, inside the Tasks panel, a second `Tabs` whose triggers are styled as pill chips (`rounded-full`, border, existing tokens) in a wrapping row. Radix provides arrow-key navigation, `aria-selected`, and panel relationships, so there is no custom keyboard code. Each tab list gets its own `aria-label` ("Result views", "Task attempts") so screen-reader users can tell the two levels apart. Alternatives considered: plain buttons with local state, rejected because they need hand-written roving focus and ARIA; and an accordion, rejected because it is not the requested design and keeps the long vertical stack.

### Selection resets by remounting

Give the results block `key={result.messageId}` and use uncontrolled `defaultValue`s (Tasks, first chip). A new submission gets a new message ID, so the tabs remount in their initial state. No selection state or reset effect is needed. Leaving `/` already resets everything.

### Chip labels and status markers

Chip label: `{n}. {Department} · {Type}`, using the existing department labels and the current `type.replaceAll("_", " ")` formatting. The number keeps two tasks of the same department and type distinct. Failed attempts add a short "Failed" word to their chip in destructive styling, and needs-review attempts add "Review" in outline styling, so status does not rely on colour alone. The Tasks tab shows its count. The Guest reply tab adds "Failed" when delivery failed. Each chip's panel reuses the current task Card content unchanged, and the Guest reply panel reuses the acknowledgement Card. A result with no attempts shows a "No task was created" message in the Tasks panel instead of chips.

## Risks / Trade-offs

- [Outcomes are no longer all visible at once] → Status words on chips and tabs. The spec scenario covers a failed task and failed delivery being noticeable while another view is open.
- [A sticky form taller than the viewport hides its lower part until the page ends] → The form is short at `lg`. Check it at a 1024×768 viewport, and drop `sticky` if the button is cut off.
- [Two nested tab lists may be confusing by keyboard] → Separate labels, with chips only inside the Tasks panel. Check with a keyboard and screen reader.
- [No automated UI tests] → Existing processing tests are unchanged, and the change is presentational. Verify in a browser using the listed checks.

## Migration Plan

No data, API, or configuration changes. Ship the layout as one UI change and roll back by reverting the component, page width, and navbar width together.
