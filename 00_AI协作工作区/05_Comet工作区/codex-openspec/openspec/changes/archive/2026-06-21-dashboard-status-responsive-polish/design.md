## Context

The current dashboard already has a seven-card KPI row, a separate risk/task section below it, and an admin maintenance page with active and archived task filters. The latest baseline uses content-sized KPI grid columns, which makes the full KPI row narrower than the content sections below; responsive CSS also switches the row to two columns below 760px even when the mobile shell is effectively used in landscape. Dashboard status derivation still treats planned-start-overdue tasks without an actual start as delayed-start, but the desired business meaning is now based on comparing actual start against planned start.

## Goals / Non-Goals

**Goals:**

- Make the KPI row fill the same main content width as the sections below while keeping all seven fixed cards in one row where the dashboard shell is intended to be readable.
- Update delayed-start and not-started metrics to the new explicit actual-start-date definitions.
- Keep the active and archived admin task lists visually consistent in height, with internal scrolling for longer lists.
- Add focused regression tests so later UI changes do not accidentally reintroduce two-column KPI rows or legacy status counting.

**Non-Goals:**

- Do not change CloudBase adapters, data persistence, deployment files, task schema, or seed data.
- Do not redesign the full dashboard page or admin workflow.
- Do not touch restored project documentation directories or Claude-only workspaces.

## Decisions

1. Use status derivation based on actual-start presence first.
   - Chosen: classify delayed-start only when `actualStartDate > plannedStartDate`; classify not-started when `actualStartDate` is absent.
   - Alternative considered: keep planned date compared to today for delayed starts. Rejected because the user clarified that missing actual start means not-started, not delayed-start.

2. Keep the seven KPI cards as one fixed row and let the row occupy the available content width.
   - Chosen: adjust `.metric-grid` away from pure max-content sizing toward seven equal or bounded tracks that fill the container, with responsive handling that preserves a horizontal row on mobile landscape.
   - Alternative considered: keep content-sized cards and center them. Rejected because it still leaves the top dashboard visually disconnected from the wider risk panel.

3. Constrain admin list height at the panel/list level rather than trimming data.
   - Chosen: keep all active tasks available, but make overflow scroll inside the task-list area so active and archived filters share the same panel height behavior.
   - Alternative considered: paginate active tasks. Rejected as a larger workflow change not requested here.

## Risks / Trade-offs

- KPI cards can become compact on narrow landscape viewports -> mitigate with minimum card widths and horizontal overflow instead of wrapping into two columns.
- Changing delayed-start semantics will change reported counts compared with older deployments -> mitigate with explicit tests and clear spec language.
- Admin list height depends on surrounding grid/flex rules -> mitigate with CSS regression tests that assert the relevant sizing and overflow properties.
