# project-dashboard-display Specification

## Purpose
TBD - created by archiving change project-dashboard-frontend. Update Purpose after archive.
## Requirements
### Requirement: Project summary dashboard
The system SHALL display a project summary dashboard with project name, project period, total duration, elapsed duration, overall progress, task status counts, overdue tasks, and upcoming warning counts.

#### Scenario: View project summary
- **WHEN** a user opens the project dashboard page on a desktop-width viewport
- **THEN** the user sees high-level project progress and risk indicators without editing data
- **AND** the KPI cards are arranged in a single row when the viewport has enough horizontal space
- **AND** the KPI card widths adapt to their content instead of expanding into large empty columns

#### Scenario: Order summary indicators
- **WHEN** the user scans the project summary KPI row
- **THEN** the delayed or near-due indicator and delayed-start indicator appear immediately after the total task indicator
- **AND** completed, in-progress, and not-started indicators appear after those risk indicators

#### Scenario: Identify delayed starts
- **WHEN** a task's planned start date is before today and the task has no actual start date
- **THEN** the dashboard counts and labels the task as start-delayed rather than merely not-started

### Requirement: Task detail table
The system SHALL display project tasks in a readable detail table including task grouping, task name, planned dates, actual dates, duration, completion ratio, overdue days, warning state, resource owner, responsible person, and remarks when available.

#### Scenario: Inspect task details
- **WHEN** a user reviews the task detail section
- **THEN** the user can identify each task's schedule, progress, owner, and risk information

### Requirement: Emphasize project content in task details
The system SHALL visually emphasize the project content field more strongly than the task name in task detail displays.

#### Scenario: Read task detail text hierarchy
- **WHEN** a user scans a task detail row or task card
- **THEN** the project content text is visually emphasized before the task name

### Requirement: Timeline or Gantt visualization
The system SHALL provide a timeline or Gantt-style visualization that represents planned task spans and actual task spans using the project task data.

#### Scenario: Compare task schedule spans
- **WHEN** a user views the timeline or Gantt section
- **THEN** the user can compare task timing and understand which work items overlap or are upcoming

#### Scenario: Distinguish planned and actual spans
- **WHEN** the timeline displays both planned and actual dates for a task
- **THEN** the planned span is represented by a blue bar
- **AND** the actual span is represented by a red bar with a different height from the planned bar
- **AND** the timeline includes a legend explaining the blue and red bars

#### Scenario: Omit bar percentage text
- **WHEN** the user views a task bar in the timeline or Gantt section
- **THEN** the bar does not display the completion percentage text inside the bar
- **AND** the bar remains readable without truncated percentage labels

### Requirement: Warning presentation
The system SHALL visually distinguish overdue, due-today, due-within-week, and future warning states in the dashboard and task detail views.

#### Scenario: Identify risky tasks
- **WHEN** one or more tasks are overdue or near their planned finish date
- **THEN** the dashboard and task list highlight those tasks with clear warning indicators

### Requirement: Mobile landscape guidance
The system SHALL guide mobile users toward landscape viewing when the viewport is too narrow for the project table or timeline to remain readable.

#### Scenario: Open dashboard on portrait phone
- **WHEN** a user opens the dashboard on a narrow portrait mobile viewport
- **THEN** the system displays a landscape guidance state or equivalent layout behavior that protects table and timeline readability

#### Scenario: Preserve readable layout
- **WHEN** the dashboard is viewed on desktop or mobile landscape viewport sizes
- **THEN** dashboard text, metric cards, task table cells, timeline bars, and guidance copy fit within their containers without unreadable overflow or incoherent overlap

