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

#### Scenario: Create task
- **WHEN** an administrator creates a task with valid required fields
- **THEN** subsequent project data reads include the new active task

### Requirement: Archive and restore tasks
The system SHALL soft-archive tasks instead of physically deleting them and SHALL allow archived tasks to be restored.

#### Scenario: Archive task
- **WHEN** an administrator archives a task
- **THEN** the public project data read hides the archived task by default
- **AND** the administrative read can still access the archived task

#### Scenario: Restore archived task
- **WHEN** an administrator restores an archived task
- **THEN** subsequent public project data reads include the task again

### Requirement: Validate schedule fields
The system SHALL validate task schedule inputs before saving obvious invalid data such as an end date earlier than its corresponding start date or missing required task identity fields.

#### Scenario: Reject invalid task dates
- **WHEN** an administrator submits a task with a planned end date earlier than the planned start date
- **THEN** the system rejects the change and reports a validation error

### Requirement: Support manual completion override
The system SHALL allow administrators to provide a manual completion ratio while preserving actual completion date as the highest-priority completion signal.

#### Scenario: Manual completion overrides automatic progress
- **WHEN** an administrator saves an active task with a valid manual completion ratio
- **THEN** subsequent project data reads use the manual completion ratio instead of the automatic elapsed-time ratio

#### Scenario: Actual end date takes precedence
- **WHEN** a task has an actual end date and a manual completion ratio below 100%
- **THEN** subsequent project data reads treat the task as 100% complete

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
