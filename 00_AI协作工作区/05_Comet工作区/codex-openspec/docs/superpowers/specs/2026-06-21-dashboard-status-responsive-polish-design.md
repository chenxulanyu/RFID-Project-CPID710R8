---
comet_change: dashboard-status-responsive-polish
role: technical-design
canonical_spec: openspec
---

# Dashboard Status And Responsive Polish Design

## Context

The OpenSpec change narrows this work to five frontend refinements: dashboard KPI row width, delayed-start semantics, admin task-list height consistency, not-started semantics, and mobile landscape KPI behavior. The current implementation already has the relevant seams in `dashboardMetrics.ts`, `ProjectSummaryDashboard.tsx`, `AdminPage.tsx`, and `styles.css`, so the implementation should be small and test-led.

## Technical Approach

### Status Metrics

`getDashboardStatus` should treat actual dates as authoritative. A task with `actualEndDate` remains finished. A task with `actualStartDate` later than `plannedStartDate` becomes `start-delayed`; otherwise a task with `actualStartDate` remains `in-progress`. A task without `actualStartDate` becomes `not-started`, unless an existing completed signal such as `actualEndDate` applies first.

This intentionally removes the previous rule that classified tasks as delayed-start merely because their planned start was before today. Under the confirmed business definition, a missing actual start means the task has not started, not that it started late.

### KPI Layout

The seven KPI cards should remain a fixed single row and fill the available dashboard content width. CSS should move away from max-content-only tracks and use seven bounded `1fr` tracks with minimum widths. The row can use horizontal overflow as a narrow-viewport fallback, but it should not wrap to two columns in the mobile landscape path.

Cards should keep stable dimensions and avoid large internal blanks. The implementation should prefer CSS-only layout changes unless component markup proves insufficient.

### Admin Task List

The active and archived task filters should share the same list-panel sizing rules. The left task-list panel should not grow taller just because active tasks have more rows. The list itself should own the overflow with `overflow: auto`, while the panel/grid should provide a bounded height compatible with the right-side project/task sections.

## Testing Plan

- Update `dashboardMetrics.test.ts` before implementation:
  - actual start later than planned start counts as delayed-start;
  - missing actual start counts as not-started;
  - actual start on or before planned start does not count as delayed-start.
- Update `styles.test.ts` before implementation:
  - KPI grid uses seven width-filling columns rather than max-content-only sizing;
  - mobile CSS does not switch KPI grid to two columns;
  - admin task list has bounded height behavior and internal scrolling.
- Run full verification commands after implementation:
  - `npm test --workspace web`
  - `npm run build --workspace web`
  - `openspec validate --specs --strict`

## Risks

- The new delayed-start definition will reduce or change the displayed count compared with previous builds. This is expected and should be captured in tests.
- Seven cards in one row can be tight on small landscape screens. The layout should protect text with minimum widths and horizontal scrolling rather than forcing a two-column stack.
- Admin list height depends on CSS grid/flex interactions. Tests should assert the intended CSS contract, and manual visual review should focus on switching active/archived filters.
