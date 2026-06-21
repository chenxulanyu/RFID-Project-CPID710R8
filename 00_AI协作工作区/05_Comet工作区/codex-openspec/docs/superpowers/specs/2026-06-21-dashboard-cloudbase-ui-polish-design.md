---
comet_change: dashboard-cloudbase-ui-polish
role: technical-design
canonical_spec: openspec
archived-with: 2026-06-21-dashboard-cloudbase-ui-polish
status: final
---

# Dashboard CloudBase UI Polish Technical Design

## Context

The deployed v1.1 build introduced several connected regressions and polish issues:

- Admin task maintenance now allows `resourceOwner` and `responsiblePerson` to be empty, but the public project progress service still treats those fields as required. A newly saved CloudBase task can therefore be valid for admin persistence but invalid for public dashboard selection, causing the dashboard to fall back to seeded defaults.
- Adding the "未启动" KPI made the metric grid wrap into two rows on desktop, because the grid still uses six equal-width columns.
- The timeline now draws plan and actual bars but lacks a legend and still renders completion percentage text inside the plan bar.
- The admin right column stretches the project metadata section to match the tall left task list, creating a large blank gap before task details.

## Goals

- Align public task validity rules with admin task save rules: resource owner and responsible person are optional.
- Preserve fallback protection for truly malformed task data.
- Keep dashboard KPI cards on one desktop row when there is enough horizontal space, ordered for risk-first scanning.
- Add a timeline legend and remove percentage text from timeline bars.
- Keep the admin project metadata section compact while preserving the left task list height behavior.

## Non-Goals

- Do not change CloudBase environment configuration, collection names, security rules, access keys, or deployment files.
- Do not alter the task persistence schema beyond reading optional owner/person fields safely.
- Do not redesign project period auto-extension, archive/delete flows, or mobile landscape behavior.
- Do not touch restored local project documents or unrelated generated folders.

## Decisions

### Public Data Validation

`projectService.ts` remains the public data boundary. Its `hasRequiredTaskFields` should require only the same fields that admin validation and CloudBase required-document filtering now require:

- `id`
- `milestoneCode`
- `projectContent`
- `taskName`
- `plannedStartDate`
- `plannedEndDate`

This preserves the existing fallback behavior for genuinely malformed remote data while preventing optional owner/person fields from invalidating otherwise usable CloudBase tasks.

### Dashboard KPI Layout

`ProjectSummaryDashboard.tsx` should reorder cards as:

1. 总体进度
2. 任务总数
3. 延期/临期
4. 延迟启动
5. 已完成
6. 进行中
7. 未启动

`styles.css` should switch the desktop `.metric-grid` away from `repeat(6, minmax(120px, 1fr))`. A content-aware grid with explicit minimum card widths prevents the large empty columns shown in the screenshot and lets seven cards fit on the available desktop width. Responsive media queries can still wrap on narrower screens to protect readability.

### Timeline Legend

`ProjectTimeline.tsx` should render a compact legend near the timeline title:

- 蓝色：计划周期
- 红色：实际周期

Timeline bars should no longer render the completion percentage inside the blue plan bar. Completion remains available in the summary and detail table, while the timeline focuses on planned-vs-actual date spans.

### Admin Panel Height

The left `admin-panel` should continue to stretch so the task list can use available height. The right `.admin-panels` should align to the start and its child `.admin-section` elements should use natural content height. This directly fixes the blank gap without reducing the left task list.

## Testing Strategy

- Add a `projectService` regression test proving a repository task with blank owner/person fields is returned by `getProjectProgress` and does not trigger fallback to the seeded 31 tasks.
- Add dashboard rendering tests for KPI order.
- Add a CSS regression test for desktop metric grid content-aware layout and admin panel natural height.
- Update timeline tests to require legend text and assert no percentage text is rendered inside timeline bars.
- Run `npm test --workspace web` and `npm run build --workspace web`.

## Review Notes

Claude Code review should focus on:

- Whether the CloudBase/front-end fallback root cause is fixed at the correct boundary.
- Whether optional owner/person fields remain optional consistently across admin validation, CloudBase document filtering, and public reads.
- Whether the UI changes are scoped to dashboard/timeline/admin layout and do not touch deployment configuration.
