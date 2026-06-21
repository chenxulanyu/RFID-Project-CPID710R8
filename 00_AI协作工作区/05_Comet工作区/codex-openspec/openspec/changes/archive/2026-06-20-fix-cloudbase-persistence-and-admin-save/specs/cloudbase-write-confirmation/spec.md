## ADDED Requirements

### Requirement: CloudBase write confirmation
The system SHALL confirm CloudBase project and task writes before reporting success.

#### Scenario: Reject error response
- **WHEN** a CloudBase save call returns an error code or a write-back mismatch
- **THEN** the system MUST report the save as failed
- **AND** the system MUST NOT show a success message

#### Scenario: Confirm persistence
- **WHEN** a project or task save succeeds
- **THEN** the system MUST verify the persisted document before showing success
- **AND** the verified data MUST match the submitted content
