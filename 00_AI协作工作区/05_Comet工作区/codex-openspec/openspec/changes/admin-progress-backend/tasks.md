## 1. Management Data Flow

- [x] 1.1 Define administrative read and write service contracts for project metadata and task data.
- [x] 1.2 Implement a replaceable repository layer using local or mock persistence for the first version.
- [x] 1.3 Ensure the display data service can read data maintained through the administrative service.
- [x] 1.4 Ensure public display reads hide archived tasks while admin reads can include them.

## 2. Admin Maintenance UI or Endpoint

- [ ] 2.1 Provide a management entry for editing project metadata.
- [ ] 2.2 Provide a management entry for creating or updating task progress data.
- [ ] 2.3 Provide management actions for archiving and restoring tasks without physical deletion.
- [ ] 2.4 Keep management routes or endpoints separated from public display routes pending final authentication decisions.

## 3. Validation and Derived Data

- [x] 3.1 Add validation for required task identity and schedule fields.
- [x] 3.2 Add validation for date ordering on planned and actual date ranges.
- [x] 3.3 Add validation for manual completion ratio bounds and duplicate task IDs.
- [x] 3.4 Centralize derived progress, overdue, and warning calculations in service utilities.
- [x] 3.5 Ensure actual end date takes precedence over manual completion ratio.

## 4. Verification

- [x] 4.1 Verify a project metadata update is reflected in subsequent reads.
- [x] 4.2 Verify a task progress update is reflected in the dashboard data contract.
- [x] 4.3 Verify a newly created task is reflected in the dashboard data contract.
- [x] 4.4 Verify archived tasks are hidden from public reads and restored tasks reappear.
- [x] 4.5 Verify invalid schedule data is rejected with a clear validation error.
