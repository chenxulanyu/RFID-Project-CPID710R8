## MODIFIED Requirements

### Requirement: Project summary dashboard
The system SHALL display a project summary dashboard with project name, project period, total duration, elapsed duration, overall progress, task status counts, overdue tasks, and upcoming warning counts.

#### Scenario: View project summary
- **WHEN** a user opens the project dashboard page
- **THEN** the user sees high-level project progress and risk indicators without editing data

#### Scenario: Identify delayed starts
- **WHEN** a task's planned start date is before today and the task has no actual start date
- **THEN** the dashboard counts and labels the task as start-delayed rather than merely not-started

### Requirement: Task detail table
The system SHALL display project tasks in a readable detail table including task grouping, task name, planned dates, actual dates, duration, completion ratio, overdue days, warning state, resource owner, responsible person, and remarks when available.

#### Scenario: Inspect task details
- **WHEN** a user reviews the task detail section
- **THEN** the user can identify each task's schedule, progress, owner, and risk information

### Requirement: Timeline or Gantt visualization
The system SHALL provide a timeline or Gantt-style visualization that represents planned task spans and indicates progress or status using the project task data.

#### Scenario: Compare task schedule spans
- **WHEN** a user views the timeline or Gantt section
- **THEN** the user can compare task timing and understand which work items overlap or are upcoming

#### Scenario: Show bar-end labels
- **WHEN** a user views a task bar in the timeline or Gantt section
- **THEN** the task's planned start date and planned end date are displayed inside the bar at the left and right ends respectively
- **AND** the completion percentage remains readable without truncating the bar label

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

### Requirement: Emphasize project content in task details
The system SHALL visually emphasize the project content field more strongly than the task name in task detail displays.

#### Scenario: Read task detail text hierarchy
- **WHEN** a user scans a task detail row or task card
- **THEN** the project content text is visually emphasized before the task name
