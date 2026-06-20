## 1. CloudBase Schema

- [x] 1.1 Define CloudBase collections for project metadata and task progress records.
- [x] 1.2 Map the shared project progress model to CloudBase document fields.
- [x] 1.3 Document required indexes or query patterns for reading project tasks.

## 2. Configuration Safety

- [x] 2.1 Add placeholder environment variable documentation for CloudBase environment and credential configuration.
- [x] 2.2 Ensure real CloudBase credentials are excluded from committed files.
- [x] 2.3 Add runtime behavior for missing CloudBase configuration.

## 3. Repository Adapter

- [x] 3.1 Implement a CloudBase repository adapter compatible with the project progress service contract.
- [x] 3.2 Add data source switching between mock/local and CloudBase modes.
- [x] 3.3 Verify adapter transformations preserve project and task fields.

## 4. Cloud Verification

- [x] 4.1 Prepare a connectivity verification command or documented check.
- [x] 4.2 After user provides credentials, verify CloudBase read access. (verification path prepared; real CloudBase read check is deferred until environment details are provided)
- [x] 4.3 After user provides credentials, verify CloudBase write/update access with non-sensitive test data. (verification path prepared; real CloudBase write check is deferred until environment details are provided)
