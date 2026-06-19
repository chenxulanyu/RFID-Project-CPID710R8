## ADDED Requirements

### Requirement: CloudBase data schema
The system SHALL define CloudBase data structures for project metadata and project task progress records that preserve the shared project progress data contract.

#### Scenario: Store project task in CloudBase
- **WHEN** a project task is saved to CloudBase
- **THEN** its identity, project association, schedule, progress, owner, warning-relevant fields, and remarks can be restored into the shared project progress model

### Requirement: CloudBase repository adapter
The system SHALL provide a CloudBase-backed repository adapter that supports reading project data and writing administrative updates through the existing service contract.

#### Scenario: Read project data from CloudBase
- **WHEN** CloudBase configuration is present and the frontend or backend requests project data
- **THEN** the system reads project metadata and task records from CloudBase through the repository adapter

### Requirement: Secret-safe configuration
The system SHALL configure CloudBase credentials through environment variables or deployment secrets and MUST NOT commit real credentials to the repository or planning artifacts.

#### Scenario: Prepare repository for sharing
- **WHEN** the project is prepared for GitHub or Gitee
- **THEN** only placeholder configuration names and examples are present, with no real CloudBase secret values

### Requirement: Local fallback behavior
The system SHALL keep local or mock data usable when CloudBase configuration is absent, unless the runtime is explicitly configured to require CloudBase.

#### Scenario: Run without CloudBase credentials
- **WHEN** a developer starts the project without CloudBase environment variables
- **THEN** the application can still load local or mock project data for development and review

### Requirement: CloudBase connectivity verification
The system SHALL include a verification path for confirming CloudBase read and write connectivity once the user provides credentials.

#### Scenario: Verify cloud persistence
- **WHEN** valid CloudBase credentials and environment configuration are provided
- **THEN** a verification command or documented check confirms that project data can be read and updated
