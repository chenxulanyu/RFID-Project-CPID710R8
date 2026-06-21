# project-web-foundation Specification

## Purpose
TBD - created by archiving change web-app-foundation. Update Purpose after archive.
## Requirements
### Requirement: Website foundation is runnable locally
The system SHALL provide a website project foundation that can be installed and started in a local development environment without requiring Tencent CloudBase credentials.

#### Scenario: Start local development site
- **WHEN** a developer follows the documented local startup command
- **THEN** the website starts successfully using local or mock project data

### Requirement: Project progress domain model
The system SHALL define structured project progress entities covering project metadata, milestones or tasks, planned dates, actual dates, duration fields, completion ratio, warning state, resource owner, responsible person, and remarks.

#### Scenario: Represent Excel task row
- **WHEN** a task from `CPID710R8_项目进度管理.xlsx` is mapped into the website model
- **THEN** the model preserves the task identity, schedule, progress, warning, ownership, and remark fields needed by later display and editing features

### Requirement: Mock data source
The system SHALL include a mock data source based on the current CPID710R8 project schedule so downstream frontend work can proceed before CloudBase is configured.

#### Scenario: Load project data without cloud configuration
- **WHEN** the application runs without CloudBase environment variables
- **THEN** it loads project and task data from the mock source rather than failing

### Requirement: Data access abstraction
The system SHALL expose project progress data through a data access abstraction rather than coupling views directly to mock data files.

#### Scenario: Replace data source later
- **WHEN** a CloudBase-backed data source is introduced in a later change
- **THEN** display components can continue using the same data access contract without direct rewrites for storage details

