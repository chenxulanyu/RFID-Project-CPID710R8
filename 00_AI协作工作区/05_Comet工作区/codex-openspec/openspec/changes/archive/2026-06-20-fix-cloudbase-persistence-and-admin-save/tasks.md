## 1. CloudBase persistence hardening

- [x] 1.1 Add regression tests for incomplete project documents, CloudBase error responses, and persisted write verification.
- [x] 1.2 Update CloudBase project/task mapping so missing project fields fall back to seeded defaults.
- [x] 1.3 Make CloudBase writes fail when the SDK returns an error body or the persisted document does not match the submitted payload.

## 2. Admin save workflow

- [x] 2.1 Replace the separate project/task save buttons with one unified save action.
- [x] 2.2 Save project metadata and the current task together, then reload the persisted state.
- [x] 2.3 Update admin regression tests to cover the unified save flow and success messaging.

## 3. Verification and records

- [x] 3.1 Run focused tests for CloudBase persistence and admin save behavior.
- [x] 3.2 Run the full web test suite and production build.
- [x] 3.3 Update version and changelog records for this hotfix.
