# Tasks

## 1. Side-by-side layout

- [x] 1.1 Widen `/` in `src/routes/index.tsx` and the navigation bar in `src/components/Header.tsx` to `max-w-6xl`, leaving `/reference` at `max-w-3xl`. Restructure `GuestMessageTester` into a grid that is one column below `lg` and two columns from `lg`, with a narrower sticky form column and the Sample/Channel selects stacked from `lg`. Verify in a browser at 1280px and 1024×768 (form stays in view and its button isn't cut off while long results scroll) and at 375px (stacked, form first, no horizontal scroll), and that `/reference` keeps its width.
- [x] 1.2 Give the results column a placeholder before the first submission and progress text while processing, keeping the existing `role="status"` live region and `role="alert"` errors announcing as before, and keeping the submitted-message echo and extraction error above the results. Verify each state in the browser, including a 401 error and an extraction error.

## 2. Result tabs and task chips

- [x] 2.1 Add Radix `Tabs` from `radix-ui` with Tasks (showing its count) and Guest reply tabs, with Tasks selected initially, the tab list labelled "Result views", and "Failed" added to the Guest reply tab when delivery failed. Move the current acknowledgement Card unchanged into the Guest reply panel. Verify in the browser with a successful sample and with mock messaging failing (for example, a wrong `MOCK_API_KEY` in an isolated environment).
- [x] 2.2 Inside the Tasks panel, add a second `Tabs` labelled "Task attempts", with one pill chip per attempt labelled `{n}. {Department} · {Type}` that shows "Failed" or "Review" text for failed or needs-review attempts. Each chip panel reuses the current task Card content unchanged, and an empty attempt list shows "No task was created". Key the results block by `result.messageId` so a new submission resets to Tasks and the first chip. Verify with the `same-department`, `multi-en`, `unknown`, `missing`, and a Filipino sample that each chip shows its attempt's full spec-required details, including original evidence; that resubmitting from the Guest reply tab or a later chip reopens Tasks on the first chip; and that a failed task's chip is marked while another chip is selected.
- [x] 2.3 Update the README "Using the routing tester" walkthrough (step 4) to describe the side-by-side layout, the Tasks and Guest reply tabs, the numbered task chips, and their Failed/Review markers. Verify it matches the rendered UI and leaves the `/reference` paragraph unchanged.

## 3. Integration verification

- [x] 3.1 Run `vp check`, `vp test`, and `vp run build`. Confirm they pass, apart from any failure already present on `main` (record it if so), and review the diff for edits outside the tester, the page width, the navbar width, and the README.
- [x] 3.2 In a browser, use only the keyboard to move through the form, the result tabs, and the chips with Tab and arrow keys, confirming that the selected state is announced (screen reader or accessibility tree) and that hidden panels are not focusable. Recheck navbar alignment and wrapping at desktop and 375px, sign-out, and that leaving `/` for `/reference` and returning shows the initial empty results state. Record any checks that could not be run.
- [x] 3.3 Run `openspec validate split-tester-results-layout --strict`, and confirm that the delta modifies only "Display end-to-end outcomes" and adds only the layout and result-tabs requirements to `routing-test-ui`.

## Workflow follow-up

- Archive the change after review, then confirm that the main `routing-test-ui` spec contains the modified and added requirements.
