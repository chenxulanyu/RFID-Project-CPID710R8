## Why

The latest dashboard polish introduced three user-visible regressions: the admin task list no longer aligns with the combined height of the project and task panels, lifecycle KPI counts do not add up to the task detail count, and delayed-start risk cards can appear as uncolored white cards. These issues make the dashboard harder to trust and the admin layout look unfinished.

## What Changes

- Fix dashboard lifecycle metrics so completed, in-progress, and not-started counts always partition the task detail rows.
- Keep delayed-start as an independent risk metric instead of a mutually exclusive lifecycle status.
- Ensure delayed-start risk cards have a consistent visual warning treatment even when the task's deadline warning state is `none`.
- Adjust the admin task-list panel so its height aligns with the right-side project metadata plus task detail panels, with internal scrolling for long lists.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-dashboard-display`: dashboard KPI semantics and delayed-start risk presentation are corrected.
- `admin-progress-management`: administrative task-list height alignment behavior is corrected.

## Impact

- Affected frontend logic: dashboard status derivation, delayed-start risk labeling, and metric counts.
- Affected frontend UI: risk card warning classes and admin layout/list height CSS.
- Affected tests: dashboard metric partition tests, risk presentation tests, and CSS layout regression tests.
- No CloudBase persistence, deployment configuration, data schema, or project source data changes are in scope.
