## 1. Tests First

- [x] Add or update dashboard metrics tests for delayed-start tasks with late actual start dates.
- [x] Add or update dashboard metrics tests for not-started tasks without actual start dates.
- [x] Add or update CSS/layout regression tests for the seven-card KPI row filling the content width and staying horizontal on mobile landscape.
- [x] Add or update CSS/layout regression tests for consistent active/archived admin task-list height with internal scrolling.

## 2. Implementation

- [x] Update dashboard status derivation and metric counting to use the new actual-start-date definitions.
- [x] Adjust KPI grid/card CSS so the fixed seven-card row spans the content width without reverting to a two-column mobile landscape layout.
- [x] Adjust admin task-list CSS so active and archived filters use the same bounded height behavior and overflow scrolls inside the list.

## 3. Verification

- [x] Run `npm test --workspace web`.
- [x] Run `npm run build --workspace web`.
- [x] Run `openspec validate --specs --strict`.
- [x] Prepare a Claude Code review instruction covering the five requested behaviors and the files changed.
