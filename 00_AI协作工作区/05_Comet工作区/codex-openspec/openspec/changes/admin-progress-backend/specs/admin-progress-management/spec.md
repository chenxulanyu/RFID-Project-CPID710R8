## ADDED Requirements

### Requirement: Maintain project metadata
The system SHALL provide an administrative capability to view and update project metadata including project name, project period, and descriptive information required by the display frontend.

#### Scenario: Update project period
- **WHEN** an administrator updates the project start or end date with valid dates
- **THEN** the saved project metadata is available to the frontend data service

### Requirement: Maintain task progress data
The system SHALL provide an administrative capability to create or update task data including milestone grouping, task name, planned dates, actual dates, progress input, resource owner, responsible person, and remarks.

#### Scenario: Update task actual progress
- **WHEN** an administrator updates a task's actual start date, actual end date, or progress-related input
- **THEN** subsequent project data reads reflect the updated task information

### Requirement: Validate schedule fields
The system SHALL validate task schedule inputs before saving obvious invalid data such as an end date earlier than its corresponding start date or missing required task identity fields.

#### Scenario: Reject invalid task dates
- **WHEN** an administrator submits a task with a planned end date earlier than the planned start date
- **THEN** the system rejects the change and reports a validation error

### Requirement: Provide project data read service
The system SHALL provide a backend or service-layer read operation that returns project metadata and task progress data using the shared project progress data contract.

#### Scenario: Frontend reads latest project data
- **WHEN** the display frontend requests project progress data
- **THEN** the service returns the latest maintained project metadata and task list

### Requirement: Storage implementation is replaceable
The system SHALL isolate administrative reads and writes behind a storage or repository interface so a later CloudBase adapter can replace local or mock persistence without changing management workflows.

#### Scenario: Swap persistence adapter
- **WHEN** CloudBase persistence is introduced later
- **THEN** the administrative management flow continues using the same service contract
