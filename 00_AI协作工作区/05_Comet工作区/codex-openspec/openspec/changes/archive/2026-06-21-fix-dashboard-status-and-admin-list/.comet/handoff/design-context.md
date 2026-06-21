# Comet Design Handoff

- Change: fix-dashboard-status-and-admin-list
- Phase: design
- Mode: compact
- Context hash: 4fbea72c5ec2ee4c77679db2288ed31763d0bd347c2cb6df9d56eee9605fdc5b

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/fix-dashboard-status-and-admin-list/proposal.md

- Source: openspec/changes/fix-dashboard-status-and-admin-list/proposal.md
- Lines: 1-28
- SHA256: 9ddae7b87a8f8dd7ec764328905e41527eab9128b6ec1158361ad470fda3f6ae

```md
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
```

## openspec/changes/fix-dashboard-status-and-admin-list/design.md

- Source: openspec/changes/fix-dashboard-status-and-admin-list/design.md
- Lines: 1-38
- SHA256: 19064b229269b31ceb7ce5c7c39f6c7f088b8d11ee12aad92b977f9ae88ff093

```md
## Context

The dashboard currently uses `start-delayed` as a `DashboardTaskStatus`, so a task with an actual start date later than its planned start can be excluded from completed/in-progress/not-started counts. This makes the lifecycle counters fail to reconcile with the task detail count. Risk cards also use `warning-${warningState}` plus `status-${dashboardStatus}`, which leaves completed delayed-start tasks styled as `status-finished warning-none` without a colored warning style. The admin list height uses a viewport-based `max-height`, so it can be shorter than the right-side project and task panels combined.

## Goals / Non-Goals

**Goals:**

- Make lifecycle counts reconcile exactly with `totalDetailTasks`.
- Preserve delayed-start as an independent risk indicator and KPI.
- Apply a consistent visual warning style to delayed-start risk cards.
- Align the admin task-list panel with the right-side project metadata and task detail area, while preserving list-internal scrolling.

**Non-Goals:**

- Do not change CloudBase read/write behavior.
- Do not change task persistence, seed data, deployment files, or repository remotes.
- Do not redesign the dashboard or admin page beyond the reported defects.

## Decisions

1. Separate lifecycle state from delayed-start risk.
   - Lifecycle status should be derived from actual dates: actual end -> finished; actual start without actual end -> in-progress; no actual start -> not-started.
   - Delayed-start should be computed by `actualStartDate > plannedStartDate` and exposed as a risk/KPI flag, not as a lifecycle status that replaces in-progress.

2. Style delayed-start risks with a dedicated warning class.
   - A delayed-start risk should render with a class such as `warning-start-delayed` even when `warningState` is `none`.
   - This avoids relying on lifecycle status for risk color and keeps completed delayed-start tasks visibly highlighted.

3. Use grid stretch for admin panel height alignment.
   - Remove the viewport-only `max-height` cap from the left admin panel.
   - Let the grid stretch the left panel to the right column height, and keep `overflow: auto` on `.admin-task-list` so task rows scroll inside the list area.

## Risks / Trade-offs

- Changing status semantics will alter counts after redeploy, but the new counts are the intended lifecycle partition.
- A delayed-start completed task may appear in both completed and delayed-start KPI counts; this is intended because those are different dimensions.
- Admin list height is still responsive to page layout; tests should lock the CSS contract rather than pixel-perfect browser height.
```

## openspec/changes/fix-dashboard-status-and-admin-list/tasks.md

- Source: openspec/changes/fix-dashboard-status-and-admin-list/tasks.md
- Lines: 1-20
- SHA256: 351c2f9cb0903af0a4ff27f56abd5415bc23bebe3196bd55befd0faf672993b1

```md
## 1. Tests First

- [ ] Add dashboard metrics regression tests proving lifecycle counts sum to `totalDetailTasks`.
- [ ] Add dashboard metrics tests proving delayed-start in-progress tasks remain in-progress and delayed-start completed tasks remain completed.
- [ ] Add risk presentation tests or assertions proving delayed-start risks receive a visible warning class/label.
- [ ] Update CSS regression tests proving the admin left panel is not capped by the old viewport-only max-height and still uses internal list scrolling.

## 2. Implementation

- [ ] Separate delayed-start risk calculation from lifecycle `dashboardStatus`.
- [ ] Update risk class/label derivation so delayed-start risks use a visible warning style even when `warningState` is `none`.
- [ ] Adjust admin layout CSS so the left task-list panel stretches to match the right-side panels and scrolls internally.

## 3. Verification

- [ ] Run `npm test --workspace web`.
- [ ] Run `npm run build --workspace web`.
- [ ] Run `openspec validate fix-dashboard-status-and-admin-list --strict`.
- [ ] Run `openspec validate --specs --strict`.
- [ ] Prepare Claude Code review instructions before archive or push.
```

## openspec/changes/fix-dashboard-status-and-admin-list/specs/admin-progress-management/spec.md

- Source: openspec/changes/fix-dashboard-status-and-admin-list/specs/admin-progress-management/spec.md
- Lines: 1-19
- SHA256: 7b829bfed6566ce5f1fae6bfcc584bfdae0f46cd3201e09ae661bb65c6e7c210

```md
## MODIFIED Requirements

### Requirement: Task list uses available panel height
The system SHALL size the administrative task list so it can expand with the available panel height before scrolling within the list area.

#### Scenario: Render task list in a tall viewport
- **WHEN** an administrator opens the maintenance page in a viewport with extra vertical space
- **THEN** the task list extends to use the available panel height rather than remaining a short content-sized column

#### Scenario: Align task list with right-side maintenance panels
- **WHEN** an administrator views the maintenance page with project metadata and task detail panels on the right
- **THEN** the left task-list panel aligns with the combined height of the visible right-side panels
- **AND** the task-list panel is not shortened by a viewport-only maximum height that leaves visible blank space below it

#### Scenario: Keep active and archived list height consistent
- **WHEN** an administrator switches between active tasks and archived tasks
- **THEN** the task-list panel height remains consistent between the two filters
- **AND** the active-task list does not become taller than the archived-task list because it has more rows
- **AND** overflowing task rows scroll inside the task-list area
```

## openspec/changes/fix-dashboard-status-and-admin-list/specs/project-dashboard-display/spec.md

- Source: openspec/changes/fix-dashboard-status-and-admin-list/specs/project-dashboard-display/spec.md
- Lines: 1-54
- SHA256: d83f9c84a387cdea7e5cd48ef36f659604f2aed7d509573771ba4c6f816a0feb

```md
## MODIFIED Requirements

### Requirement: Project summary dashboard
The system SHALL display a project summary dashboard with project name, project period, total duration, elapsed duration, overall progress, task status counts, overdue tasks, and upcoming warning counts.

#### Scenario: View project summary
- **WHEN** a user opens the project dashboard page on a desktop-width viewport
- **THEN** the user sees high-level project progress and risk indicators without editing data
- **AND** the KPI cards are arranged in a single row when the viewport has enough horizontal space
- **AND** the KPI row visually spans the same main content width as the risk and task sections instead of shrinking to only the minimum content width
- **AND** the fixed KPI cards distribute usable space without large empty columns inside individual cards

#### Scenario: Order summary indicators
- **WHEN** the user scans the project summary KPI row
- **THEN** the delayed or near-due indicator and delayed-start indicator appear immediately after the total task indicator
- **AND** completed, in-progress, and not-started indicators appear after those risk indicators

#### Scenario: Identify delayed starts
- **WHEN** a task has an actual start date later than its planned start date
- **THEN** the dashboard counts the task in the delayed-start indicator
- **AND** tasks without an actual start date are not counted as delayed-start
- **AND** tasks with an actual start date on or before the planned start date are not counted as delayed-start
- **AND** delayed-start counting does not replace the task's lifecycle status

#### Scenario: Count lifecycle task states
- **WHEN** the dashboard computes completed, in-progress, and not-started counts
- **THEN** the three counts partition the task detail rows
- **AND** the sum of completed, in-progress, and not-started equals the task detail count
- **AND** a delayed-start task with an actual start date and no actual end date counts as in-progress
- **AND** a delayed-start task with an actual end date counts as completed

#### Scenario: Count not-started tasks
- **WHEN** a task does not have an actual start date
- **THEN** the dashboard counts the task as not-started
- **AND** tasks with any actual start date are not counted as not-started

#### Scenario: Preserve single-row mobile landscape indicators
- **WHEN** the dashboard is viewed on a mobile device after the layout has switched to landscape presentation
- **THEN** the project summary KPI cards remain arranged in one horizontal row
- **AND** the row may scroll horizontally or compact spacing if needed without becoming a two-column vertical stack

### Requirement: Warning presentation
The system SHALL visually distinguish overdue, due-today, due-within-week, delayed-start, and future warning states in the dashboard and task detail views.

#### Scenario: Identify risky tasks
- **WHEN** one or more tasks are overdue, near their planned finish date, or delayed-started
- **THEN** the dashboard and task list highlight those tasks with clear warning indicators

#### Scenario: Include delayed actual starts in risk presentation
- **WHEN** a task has an actual start date later than its planned start date
- **THEN** the dashboard can include the task in delayed-start risk presentation
- **AND** the delayed-start indicator includes the task even if the task is already completed
- **AND** delayed-start risk cards and status badges use a visible warning style
- **AND** tasks that merely lack an actual start date are not treated as delayed-start risks
```

