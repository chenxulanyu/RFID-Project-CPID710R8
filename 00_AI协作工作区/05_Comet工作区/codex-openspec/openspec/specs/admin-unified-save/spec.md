# admin-unified-save Specification

## Purpose
TBD - created by archiving change fix-cloudbase-persistence-and-admin-save. Update Purpose after archive.
## Requirements
### Requirement: Unified admin save workflow
The system SHALL let administrators persist the currently edited project metadata and task details through one save action.

#### Scenario: Save combined edit
- **WHEN** an administrator edits project metadata and task details in the admin view
- **THEN** one save action persists both sets of changes
- **AND** the UI reports a combined success or failure result

#### Scenario: Keep archive actions separate
- **WHEN** an administrator archives or restores a task
- **THEN** archive and restore remain available as separate actions

