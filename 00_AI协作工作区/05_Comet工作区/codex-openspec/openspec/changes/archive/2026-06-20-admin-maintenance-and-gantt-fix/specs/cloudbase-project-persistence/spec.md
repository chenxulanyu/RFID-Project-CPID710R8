## MODIFIED Requirements

### Requirement: CloudBase repository adapter
The system SHALL provide a CloudBase-backed repository adapter that supports reading project data and writing administrative updates through the existing service contract, and SHALL treat malformed or incomplete remote documents as invalid so the UI can fall back to seeded defaults rather than rendering undefined values.

#### Scenario: Read project data from CloudBase
- **WHEN** CloudBase configuration is present and the frontend or backend requests project data
- **THEN** the system reads project metadata and task records from CloudBase through the repository adapter
- **AND** missing required project fields are recovered from the seeded default project values

#### Scenario: Reject malformed write results
- **WHEN** CloudBase returns an error code or the saved document cannot be read back consistently
- **THEN** the system MUST report the save as failed
- **AND** the system MUST NOT treat the write as successful

#### Scenario: Confirm project save after write
- **WHEN** the system saves project metadata and the first readback differs only by recoverable CloudBase serialization or timing differences
- **THEN** the system MAY retry the readback once and compare normalized project fields before declaring failure
- **AND** the system MUST still fail the save if the normalized values do not match the submitted metadata
