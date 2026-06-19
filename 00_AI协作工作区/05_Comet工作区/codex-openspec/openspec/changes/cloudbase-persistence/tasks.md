## 1. CloudBase Schema

- [ ] 1.1 Define CloudBase collections for project metadata and task progress records.
- [ ] 1.2 Map the shared project progress model to CloudBase document fields.
- [ ] 1.3 Document required indexes or query patterns for reading project tasks.

## 2. Configuration Safety

- [ ] 2.1 Add placeholder environment variable documentation for CloudBase environment and credential configuration.
- [ ] 2.2 Ensure real CloudBase credentials are excluded from committed files.
- [ ] 2.3 Add runtime behavior for missing CloudBase configuration.

## 3. Repository Adapter

- [ ] 3.1 Implement a CloudBase repository adapter compatible with the project progress service contract.
- [ ] 3.2 Add data source switching between mock/local and CloudBase modes.
- [ ] 3.3 Verify adapter transformations preserve project and task fields.

## 4. Cloud Verification

- [ ] 4.1 Prepare a connectivity verification command or documented check.
- [ ] 4.2 After user provides credentials, verify CloudBase read access.
- [ ] 4.3 After user provides credentials, verify CloudBase write/update access with non-sensitive test data.
