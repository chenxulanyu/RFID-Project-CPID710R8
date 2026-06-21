## MODIFIED Requirements

### Requirement: Maintain project metadata
The system SHALL provide an administrative capability to view and update project metadata including project name, project period, and descriptive information required by the display frontend.

#### Scenario: Update project period
- **WHEN** an administrator updates the project start or end date with valid dates
- **THEN** the saved project metadata is available to the frontend data service

#### Scenario: Lock project metadata by default
- **WHEN** an administrator opens the maintenance page
- **THEN** project metadata fields are read-only or disabled until the administrator explicitly confirms editing them

#### Scenario: Keep project section compact
- **WHEN** an administrator opens the maintenance page with a long task list on the left
- **THEN** the project metadata section uses its natural content height
- **AND** the task detail section appears directly below the project metadata section without a large blank vertical gap

### Requirement: Maintain task progress data
The system SHALL provide an administrative capability to create or update task data including milestone grouping, task name, planned dates, actual dates, progress input, optional resource owner, optional responsible person, and remarks.

#### Scenario: Update task actual progress
- **WHEN** an administrator updates a task's actual start date, actual end date, or progress-related input
- **THEN** subsequent project data reads reflect the updated task information

#### Scenario: Create task
- **WHEN** an administrator creates a task with valid required fields
- **THEN** subsequent project data reads include the new active task

#### Scenario: Create task without optional owner fields
- **WHEN** an administrator creates a task with resource owner and responsible person left blank
- **THEN** the task save succeeds if all required task identity and schedule fields are valid
- **AND** subsequent project data reads include the new active task
