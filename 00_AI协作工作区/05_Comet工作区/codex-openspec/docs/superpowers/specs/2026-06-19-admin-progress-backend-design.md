---
comet_change: admin-progress-backend
role: technical-design
canonical_spec: openspec
archived-with: 2026-06-19-admin-progress-backend
status: final
---

# Admin Progress Backend Technical Design

## Context

`project-dashboard-frontend` has delivered the read-only project dashboard. The next step is a controlled maintenance surface for the same project data: project metadata, task schedule fields, actual progress, owners, remarks, and task lifecycle. This change does not connect to CloudBase and does not implement deployment or authentication. It establishes the admin workflow, validation rules, and replaceable storage boundary that CloudBase can later implement.

## Confirmed Direction

Use a browser-local first version:

1. Admin data is persisted through `localStorage` or an equivalent browser-local adapter.
2. All read/write paths go through a repository/service boundary, not direct component state as the source of truth.
3. `/admin` uses a left-list/right-detail layout.
4. The admin page supports creating tasks, editing tasks, archiving tasks, and restoring archived tasks.
5. The dashboard reads only active tasks by default.
6. Completion ratio uses a hybrid model: automatic calculation remains the default, and admins may provide a manual completion ratio.
7. If `actualEndDate` exists, completion is treated as 100% regardless of manual completion input.

## Architecture

Extend the existing project service boundary rather than creating a separate admin-only data model.

```text
web/src/services/
├── projectRepository.ts        # ProjectRepository plus admin write contract
├── projectService.ts           # public read service and shared derivation
├── projectAdminService.ts      # admin read/write operations and validation
└── projectValidation.ts        # reusable validation helpers

web/src/features/project/
├── AdminPage.tsx               # admin page composition
├── AdminTaskList.tsx           # active/archived task selector
├── AdminTaskEditor.tsx         # task detail form
└── AdminProjectEditor.tsx      # project metadata form
```

`ProjectRepository` will support both read and write methods:

- `getProject()`
- `saveProject(project)`
- `listTaskInputs({ includeArchived })`
- `saveTaskInput(task)`
- `archiveTask(taskId, archivedAt)`
- `restoreTask(taskId)`

The first implementation can be `LocalProjectRepository`. It seeds from `cpid710r8Mock` when no local data exists, then persists updates in a versioned localStorage payload. A later CloudBase adapter should implement the same contract.

## Data Model

Extend `ProjectTaskInput` with optional admin-maintained fields:

- `manualCompletionRatio?: number`
- `isArchived?: boolean`
- `archivedAt?: string`

Derived `ProjectTask.completionRatio` follows this priority:

1. If `actualEndDate` exists, return `1`.
2. Else if `manualCompletionRatio` is a valid number from `0` to `1`, use it.
3. Else use the existing date-based calculation.

Display reads filter archived tasks by default. Admin reads can include archived tasks so the admin UI can restore them.

## Admin UI

The `/admin` page replaces `AdminPlaceholder`.

The left pane contains:

- project task list
- active/archived filter
- task status summary
- "new task" command

The right pane contains:

- project metadata section
- selected task detail form
- validation errors
- save, archive, and restore commands based on task state

The layout must preserve the previous overflow constraints:

- text fields and labels wrap or truncate predictably
- dense task lists remain scrollable inside their own region
- narrow portrait mobile view may use the same landscape guidance strategy as the dashboard

## Validation

Validation rejects obvious invalid data before saving:

- missing `id`, `milestoneCode`, `taskName`, `plannedStartDate`, `plannedEndDate`, `resourceOwner`, or `responsiblePerson`
- planned end date earlier than planned start date
- actual end date earlier than actual start date
- manual completion ratio outside `0` to `1`
- duplicate task ID on create

When `actualEndDate` exists and manual completion ratio is below `1`, the service normalizes the saved/derived completion result to `1`. The UI should communicate that actual completion date takes priority.

## Error Handling

Admin service methods return a typed success/error result or throw a domain validation error that the page catches and renders near the form. Storage failures should show a general save failure message without losing current form input.

## Testing

Use TDD for service behavior first, then component behavior:

- repository/service test: project metadata save is reflected in `getProjectProgress`
- repository/service test: task create/update is reflected in dashboard read data
- repository/service test: archived tasks are hidden from dashboard reads and restored tasks reappear
- validation test: invalid required fields, date ordering, duplicate IDs, and manual completion range are rejected
- derivation test: manual completion ratio overrides automatic progress unless `actualEndDate` exists
- component test: `/admin` renders left-list/right-detail, saves a task update, shows validation errors, and exposes archive/restore controls

## Non-Goals

- No CloudBase SDK or secrets.
- No login, RBAC, audit logs, or deployment.
- No multi-project switching.
- No physical deletion of tasks.
