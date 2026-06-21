## MODIFIED Requirements

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
