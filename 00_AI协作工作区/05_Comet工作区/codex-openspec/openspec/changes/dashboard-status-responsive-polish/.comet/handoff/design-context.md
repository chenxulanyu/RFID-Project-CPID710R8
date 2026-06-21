# Comet Design Handoff

- Change: dashboard-status-responsive-polish
- Phase: design
- Mode: compact
- Context hash: d45435d84902fe5ce617d10eaa61201c8aeba6f9b2053fba44da573c636853cd

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/dashboard-status-responsive-polish/proposal.md

- Source: openspec/changes/dashboard-status-responsive-polish/proposal.md
- Lines: 1-29
- SHA256: 9a3b965b3a413439e827d13dd441e2545bcd3dad79dfceb18d846cb24f17abc6

```md
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
```

## openspec/changes/dashboard-status-responsive-polish/design.md

- Source: openspec/changes/dashboard-status-responsive-polish/design.md
- Lines: 1-38
- SHA256: 2d8a498095c8f6ca735015277e4399aa2ebcb85177236edf9ee7301654751234

```md
## Context

The current dashboard already has a seven-card KPI row, a separate risk/task section below it, and an admin maintenance page with active and archived task filters. The latest baseline uses content-sized KPI grid columns, which makes the full KPI row narrower than the content sections below; responsive CSS also switches the row to two columns below 760px even when the mobile shell is effectively used in landscape. Dashboard status derivation still treats planned-start-overdue tasks without an actual start as delayed-start, but the desired business meaning is now based on comparing actual start against planned start.

## Goals / Non-Goals

**Goals:**

- Make the KPI row fill the same main content width as the sections below while keeping all seven fixed cards in one row where the dashboard shell is intended to be readable.
- Update delayed-start and not-started metrics to the new explicit actual-start-date definitions.
- Keep the active and archived admin task lists visually consistent in height, with internal scrolling for longer lists.
- Add focused regression tests so later UI changes do not accidentally reintroduce two-column KPI rows or legacy status counting.

**Non-Goals:**

- Do not change CloudBase adapters, data persistence, deployment files, task schema, or seed data.
- Do not redesign the full dashboard page or admin workflow.
- Do not touch restored project documentation directories or Claude-only workspaces.

## Decisions

1. Use status derivation based on actual-start presence first.
   - Chosen: classify delayed-start only when `actualStartDate > plannedStartDate`; classify not-started when `actualStartDate` is absent.
   - Alternative considered: keep planned date compared to today for delayed starts. Rejected because the user clarified that missing actual start means not-started, not delayed-start.

2. Keep the seven KPI cards as one fixed row and let the row occupy the available content width.
   - Chosen: adjust `.metric-grid` away from pure max-content sizing toward seven equal or bounded tracks that fill the container, with responsive handling that preserves a horizontal row on mobile landscape.
   - Alternative considered: keep content-sized cards and center them. Rejected because it still leaves the top dashboard visually disconnected from the wider risk panel.

3. Constrain admin list height at the panel/list level rather than trimming data.
   - Chosen: keep all active tasks available, but make overflow scroll inside the task-list area so active and archived filters share the same panel height behavior.
   - Alternative considered: paginate active tasks. Rejected as a larger workflow change not requested here.

## Risks / Trade-offs

- KPI cards can become compact on narrow landscape viewports -> mitigate with minimum card widths and horizontal overflow instead of wrapping into two columns.
- Changing delayed-start semantics will change reported counts compared with older deployments -> mitigate with explicit tests and clear spec language.
- Admin list height depends on surrounding grid/flex rules -> mitigate with CSS regression tests that assert the relevant sizing and overflow properties.
```

## openspec/changes/dashboard-status-responsive-polish/tasks.md

- Source: openspec/changes/dashboard-status-responsive-polish/tasks.md
- Lines: 1-19
- SHA256: a57b290aae56559c1438f17b0b259ad84008805ecf233cb56c29d5d948af7f84

```md
## 1. Tests First

- [ ] Add or update dashboard metrics tests for delayed-start tasks with late actual start dates.
- [ ] Add or update dashboard metrics tests for not-started tasks without actual start dates.
- [ ] Add or update CSS/layout regression tests for the seven-card KPI row filling the content width and staying horizontal on mobile landscape.
- [ ] Add or update CSS/layout regression tests for consistent active/archived admin task-list height with internal scrolling.

## 2. Implementation

- [ ] Update dashboard status derivation and metric counting to use the new actual-start-date definitions.
- [ ] Adjust KPI grid/card CSS so the fixed seven-card row spans the content width without reverting to a two-column mobile landscape layout.
- [ ] Adjust admin task-list CSS so active and archived filters use the same bounded height behavior and overflow scrolls inside the list.

## 3. Verification

- [ ] Run `npm test --workspace web`.
- [ ] Run `npm run build --workspace web`.
- [ ] Run `openspec validate --specs --strict`.
- [ ] Prepare a Claude Code review instruction covering the five requested behaviors and the files changed.
```

## openspec/changes/dashboard-status-responsive-polish/specs/admin-progress-management/spec.md

- Source: openspec/changes/dashboard-status-responsive-polish/specs/admin-progress-management/spec.md
- Lines: 1-14
- SHA256: e706b07a4e50b1d84aa6954f25ae3492c6558607d677667b50ae4a3bb4cc627f

```md
## MODIFIED Requirements

### Requirement: Task list uses available panel height
The system SHALL size the administrative task list so it can expand with the available panel height before scrolling within the list area.

#### Scenario: Render task list in a tall viewport
- **WHEN** an administrator opens the maintenance page in a viewport with extra vertical space
- **THEN** the task list extends to use the available panel height rather than remaining a short content-sized column

#### Scenario: Keep active and archived list height consistent
- **WHEN** an administrator switches between active tasks and archived tasks
- **THEN** the task-list panel height remains consistent between the two filters
- **AND** the active-task list does not become taller than the archived-task list because it has more rows
- **AND** overflowing task rows scroll inside the task-list area
```

## openspec/changes/dashboard-status-responsive-polish/specs/project-dashboard-display/spec.md

- Source: openspec/changes/dashboard-status-responsive-polish/specs/project-dashboard-display/spec.md
- Lines: 1-44
- SHA256: 4deb8b3e93aacf052e98e5efb7adf3a6962754a56bcb0ce8e3c9c1b26fca38e7

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
- **THEN** the dashboard counts and labels the task as start-delayed
- **AND** tasks without an actual start date are not counted as start-delayed
- **AND** tasks with an actual start date on or before the planned start date are not counted as start-delayed

#### Scenario: Count not-started tasks
- **WHEN** a task does not have an actual start date
- **THEN** the dashboard counts the task as not-started
- **AND** tasks with any actual start date are not counted as not-started

#### Scenario: Preserve single-row mobile landscape indicators
- **WHEN** the dashboard is viewed on a mobile device after the layout has switched to landscape presentation
- **THEN** the project summary KPI cards remain arranged in one horizontal row
- **AND** the row may scroll horizontally or compact spacing if needed without becoming a two-column vertical stack

### Requirement: Warning presentation
The system SHALL visually distinguish overdue, due-today, due-within-week, and future warning states in the dashboard and task detail views.

#### Scenario: Identify risky tasks
- **WHEN** one or more tasks are overdue or near their planned finish date
- **THEN** the dashboard and task list highlight those tasks with clear warning indicators

#### Scenario: Include delayed actual starts in risk presentation
- **WHEN** a task has an actual start date later than its planned start date
- **THEN** the dashboard can include the task in delayed-start risk presentation
- **AND** tasks that merely lack an actual start date are not treated as delayed-start risks
```

