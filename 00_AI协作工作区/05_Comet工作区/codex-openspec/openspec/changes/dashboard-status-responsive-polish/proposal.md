## Why

The dashboard 1.0 baseline is usable, but the latest UI and status-count changes made the top KPI row visually too narrow on desktop, split into two columns on mobile landscape, and kept legacy definitions for delayed-start and not-started counts. The admin task list also changes height between active and archived filters, which makes maintenance feel inconsistent.

## What Changes

- Adjust the project summary KPI row so its fixed set of indicators visually spans the same content width as the risk/task sections and remains a single horizontal row on mobile landscape.
- Change delayed-start counting to include only tasks that have an actual start date later than the planned start date.
- Change not-started counting to include every task without an actual start date.
- Keep delayed-start and not-started mutually exclusive by using actual-start presence as the first distinction.
- Make the admin active-task list use the same bounded panel height behavior as the archived-task list, scrolling internally when the task count exceeds the available list area.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-dashboard-display`: dashboard KPI layout and task status counting requirements are changing.
- `admin-progress-management`: administrative task-list sizing behavior is changing for active and archived filters.

## Impact

- Affected frontend logic: dashboard status derivation and KPI metrics.
- Affected frontend UI: KPI grid sizing and responsive rules; admin task-list panel sizing.
- Affected tests: dashboard metric status-count cases, CSS/layout regression tests for KPI row and admin list behavior.
- No CloudBase persistence, deployment configuration, data schema, or repository setup changes are in scope.
