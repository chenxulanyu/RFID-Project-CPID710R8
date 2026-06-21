## 1. Root cause and CloudBase save

- [x] 1.1 Add regression coverage for CloudBase project save readback shapes and write propagation delay.
- [x] 1.2 Adjust project save confirmation to tolerate short write propagation delay while still requiring matching business fields.
- [x] 1.3 Add permission diagnostics for CloudBase `updated: 0` responses and run focused CloudBase repository tests.

## 2. Admin layout

- [x] 2.1 Move the project save button to the left side of the project information box.
- [x] 2.2 Reorder task actions so saving task information is leftmost and archive/restore follows.
- [x] 2.3 Add or update admin layout tests.

## 3. Timeline display

- [x] 3.1 Remove start/end date labels from timeline bars.
- [x] 3.2 Remove the black current-date marker and axis start/end tick labels.
- [x] 3.3 Keep a single current date text under the timeline title area.
- [x] 3.4 Add or update timeline tests.

## 4. Records and verification

- [x] 4.1 Update VERSION and CHANGELOG.
- [x] 4.2 Run focused tests.
- [x] 4.3 Run full web tests and build.

## 5. Deployment read fallback hotfix

- [x] 5.1 Add regression coverage for missing/unreadable CloudBase `projects/cpid710r8`.
- [x] 5.2 Add regression coverage for failed CloudBase task reads while preserving intentionally empty task lists.
- [x] 5.3 Implement read fallback to seeded project metadata and seeded task inputs.
- [x] 5.4 Run full web tests and build.

## 6. Auto-id CloudBase project document support

- [x] 6.1 Add regression coverage for reading project metadata by logical `id` when CloudBase assigns an automatic `_id`.
- [x] 6.2 Add regression coverage for saving back to the auto-id project document.
- [x] 6.3 Implement lookup fallback from `doc(projectId)` to `where({ id: projectId })`.
- [x] 6.4 Run full web tests and build.

## 7. Auto-id write fallback and layout polish

- [x] 7.1 Add regression coverage for auto-id project update returning `updated: 0`.
- [x] 7.2 Write a fixed-id project document when an auto-id project document cannot be updated.
- [x] 7.3 Stabilize risk task card height and wrapping.
- [x] 7.4 Stretch the admin task list to the task detail area height.
- [x] 7.5 Run full web tests and build.
