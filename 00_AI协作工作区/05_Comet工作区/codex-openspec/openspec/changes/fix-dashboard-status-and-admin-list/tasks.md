## 1. Tests First

- [x] Add dashboard metrics regression tests proving lifecycle counts sum to `totalDetailTasks`.
- [x] Add dashboard metrics tests proving delayed-start in-progress tasks remain in-progress and delayed-start completed tasks remain completed.
- [x] Add risk presentation tests or assertions proving delayed-start risks receive a visible warning class/label.
- [x] Update CSS regression tests proving the admin left panel is not capped by the old viewport-only max-height and still uses internal list scrolling.

## 2. Implementation

- [x] Separate delayed-start risk calculation from lifecycle `dashboardStatus`.
- [x] Update risk class/label derivation so delayed-start risks use a visible warning style even when `warningState` is `none`.
- [x] Adjust admin layout CSS so the left task-list panel stretches to match the right-side panels and scrolls internally.

## 3. Verification

- [x] Run `npm test --workspace web`.
- [x] Run `npm run build --workspace web`.
- [x] Run `openspec validate fix-dashboard-status-and-admin-list --strict`.
- [x] Run `openspec validate --specs --strict`.
- [x] Prepare Claude Code review instructions before archive or push.
