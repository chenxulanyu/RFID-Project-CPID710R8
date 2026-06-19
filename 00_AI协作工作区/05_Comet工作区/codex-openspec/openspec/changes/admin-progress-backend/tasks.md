## 1. Management Data Flow

- [ ] 1.1 Define administrative read and write service contracts for project metadata and task data.
- [ ] 1.2 Implement a replaceable repository layer using local or mock persistence for the first version.
- [ ] 1.3 Ensure the display data service can read data maintained through the administrative service.

## 2. Admin Maintenance UI or Endpoint

- [ ] 2.1 Provide a management entry for editing project metadata.
- [ ] 2.2 Provide a management entry for creating or updating task progress data.
- [ ] 2.3 Keep management routes or endpoints separated from public display routes pending final authentication decisions.

## 3. Validation and Derived Data

- [ ] 3.1 Add validation for required task identity and schedule fields.
- [ ] 3.2 Add validation for date ordering on planned and actual date ranges.
- [ ] 3.3 Centralize derived progress, overdue, and warning calculations in service utilities.

## 4. Verification

- [ ] 4.1 Verify a project metadata update is reflected in subsequent reads.
- [ ] 4.2 Verify a task progress update is reflected in the dashboard data contract.
- [ ] 4.3 Verify invalid schedule data is rejected with a clear validation error.
