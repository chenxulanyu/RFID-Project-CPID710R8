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
