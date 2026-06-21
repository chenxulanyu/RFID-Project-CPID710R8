## Context

The dashboard currently uses `start-delayed` as a `DashboardTaskStatus`, so a task with an actual start date later than its planned start can be excluded from completed/in-progress/not-started counts. This makes the lifecycle counters fail to reconcile with the task detail count. Risk cards also use `warning-${warningState}` plus `status-${dashboardStatus}`, which leaves completed delayed-start tasks styled as `status-finished warning-none` without a colored warning style. The admin list height uses a viewport-based `max-height`, so it can be shorter than the right-side project and task panels combined.

## Goals / Non-Goals

**Goals:**

- Make lifecycle counts reconcile exactly with `totalDetailTasks`.
- Preserve delayed-start as an independent risk indicator and KPI.
- Apply a consistent visual warning style to delayed-start risk cards.
- Align the admin task-list panel with the right-side project metadata and task detail area, while preserving list-internal scrolling.

**Non-Goals:**

- Do not change CloudBase read/write behavior.
- Do not change task persistence, seed data, deployment files, or repository remotes.
- Do not redesign the dashboard or admin page beyond the reported defects.

## Decisions

1. Separate lifecycle state from delayed-start risk.
   - Lifecycle status should be derived from actual dates: actual end -> finished; actual start without actual end -> in-progress; no actual start -> not-started.
   - Delayed-start should be computed by `actualStartDate > plannedStartDate` and exposed as a risk/KPI flag, not as a lifecycle status that replaces in-progress.

2. Style delayed-start risks with a dedicated warning class.
   - A delayed-start risk should render with a class such as `warning-start-delayed` even when `warningState` is `none`.
   - This avoids relying on lifecycle status for risk color and keeps completed delayed-start tasks visibly highlighted.

3. Use grid stretch for admin panel height alignment.
   - Remove the viewport-only `max-height` cap from the left admin panel.
   - Let the grid stretch the left panel to the right column height, and keep `overflow: auto` on `.admin-task-list` so task rows scroll inside the list area.

## Risks / Trade-offs

- Changing status semantics will alter counts after redeploy, but the new counts are the intended lifecycle partition.
- A delayed-start completed task may appear in both completed and delayed-start KPI counts; this is intended because those are different dimensions.
- Admin list height is still responsive to page layout; tests should lock the CSS contract rather than pixel-perfect browser height.
