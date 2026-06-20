## MODIFIED Requirements

### Requirement: Task detail table
The system SHALL display project tasks in a readable detail table including task grouping, task name, planned dates, actual dates, duration, completion ratio, overdue days, warning state, resource owner, responsible person, and remarks when available.

#### Scenario: Inspect task details
- **WHEN** a user reviews the task detail section
- **THEN** the user can identify each task's schedule, progress, owner, and risk information
- **AND** every completion ratio is rendered with an explicit percent suffix

### Requirement: Timeline or Gantt visualization
The system SHALL provide a timeline or Gantt-style visualization that represents planned task spans and indicates progress or status using the project task data.

#### Scenario: Compare task schedule spans
- **WHEN** a user views the timeline or Gantt section
- **THEN** the user can compare task timing and understand which work items overlap or are upcoming
- **AND** the visible progress label on each task bar is rendered as a stable percentage string with a percent suffix
