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
