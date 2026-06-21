# cloudbase-project-persistence Specification

## Purpose
定义 CPID710R8 项目进度网站接入腾讯云 CloudBase 的数据持久化能力，包括数据结构、repository 适配、安全配置边界、本地回退和连通性验证路径。
## Requirements
### Requirement: CloudBase data schema
The system SHALL define CloudBase data structures for project metadata and project task progress records that preserve the shared project progress data contract.

#### Scenario: Store project task in CloudBase
- **WHEN** a project task is saved to CloudBase
- **THEN** its identity, project association, schedule, progress, owner, warning-relevant fields, and remarks can be restored into the shared project progress model

### Requirement: CloudBase repository adapter
The system SHALL provide a CloudBase-backed repository adapter that supports reading project data and writing administrative updates through the existing service contract, and SHALL treat malformed or incomplete remote documents as invalid so the UI can fall back to seeded defaults rather than rendering undefined values.

#### Scenario: Read project data from CloudBase
- **WHEN** CloudBase configuration is present and the frontend or backend requests project data
- **THEN** the system reads project metadata and task records from CloudBase through the repository adapter
- **AND** missing required project fields are recovered from the seeded default project values

#### Scenario: Read task without optional owner fields
- **WHEN** a CloudBase task record has valid identity, project content, task name, planned start date, and planned end date
- **AND** the task record has empty resource owner or responsible person fields
- **THEN** the frontend project data service treats the task as valid
- **AND** the frontend project data service MUST NOT fall back to seeded default tasks solely because those optional fields are empty

#### Scenario: Reject malformed write results
- **WHEN** CloudBase returns an error code or the saved document cannot be read back consistently
- **THEN** the system MUST report the save as failed
- **AND** the system MUST NOT treat the write as successful

#### Scenario: Confirm project save after write
- **WHEN** the system saves project metadata and the first readback differs only by recoverable CloudBase serialization or timing differences
- **THEN** the system MAY retry the readback once and compare normalized project fields before declaring failure
- **AND** the system MUST still fail the save if the normalized values do not match the submitted metadata

### Requirement: Secret-safe configuration
The system SHALL configure CloudBase credentials through environment variables or deployment secrets and MUST NOT commit real credentials to the repository or planning artifacts.

#### Scenario: Prepare repository for sharing
- **WHEN** the project is prepared for GitHub or Gitee
- **THEN** only placeholder configuration names and examples are present, with no real CloudBase secret values

#### Scenario: Use frontend direct CloudBase access
- **WHEN** the frontend is configured to access CloudBase directly through the Web SDK
- **THEN** it may use public Web SDK configuration such as environment ID, collection names, project ID, and Publishable Key
- **AND** it MUST NOT use or document service-side secrets such as `secretId` or `secretKey`

### Requirement: CloudBase browser access safety
The system SHALL document the CloudBase browser access safety prerequisites required for frontend direct access.

#### Scenario: Prepare CloudBase for deployed frontend access
- **WHEN** the website is configured to use the CloudBase Web SDK from a deployed browser origin
- **THEN** the setup guidance identifies the need for allowed origins or security domains, authentication mode, and database permission rules before enabling write access

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
- **AND** the verification proves both read and write round-trip behavior

