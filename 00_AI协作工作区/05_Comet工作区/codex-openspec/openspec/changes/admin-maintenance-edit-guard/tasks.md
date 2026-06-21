## 1. Admin layout and edit guard

- [x] 1.1 Restore the split layout between project metadata and task maintenance.
- [x] 1.2 Add the explicit confirmation control that unlocks project metadata editing.
- [x] 1.3 Keep task creation and task editing available independently from project metadata editing.

## 2. Save workflow and error handling

- [x] 2.1 Separate the project metadata save action from the task save action.
- [x] 2.2 Preserve clear save-failure messaging for both project and task operations.
- [x] 2.3 Verify the save flow still supports task create, update, archive, and restore.

## 3. Verification

- [x] 3.1 Update or add tests for locked project fields, split save actions, and task maintenance.
- [x] 3.2 Run the focused admin tests for the new workflow.
- [x] 3.3 Run the full web test suite and build verification.
