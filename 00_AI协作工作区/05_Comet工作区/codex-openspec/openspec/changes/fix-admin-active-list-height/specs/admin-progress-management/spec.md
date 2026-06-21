## MODIFIED Requirements

### Requirement: Task list uses available panel height
The system SHALL size the administrative task list so it can expand with the available panel height before scrolling within the list area.

#### Scenario: Keep active and archived list height consistent
- **WHEN** an administrator switches between active tasks and archived tasks
- **THEN** the task-list panel height remains consistent between the two filters
- **AND** the active-task list does not become taller than the archived-task list because it has more rows
- **AND** overflowing task rows scroll inside the task-list area
- **AND** the left task-list panel height is based on the right-side project metadata and task detail panels rather than the number of visible task rows
