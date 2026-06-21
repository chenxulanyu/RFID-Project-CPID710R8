## 1. Tests First

- [x] Add an AdminPage regression test proving the task-list aside receives a fixed measured height from the right-side panels.
- [x] Add a style regression test proving the task list has internal scrolling and does not rely on content height to size the outer panel.

## 2. Implementation

- [x] Measure the right-side admin panels height in `AdminPage`.
- [x] Apply the measured height to the left task-list panel so active and archived filters share the same outer height.
- [x] Keep `.admin-task-list` as the internal scroll container.

## 3. Verification

- [x] Run `npm test --workspace web -- AdminPage.test.tsx styles.test.ts`.
- [x] Run `npm test --workspace web`.
- [x] Run `npm run build --workspace web`.
- [x] Run `openspec validate fix-admin-active-list-height --strict`.
- [x] Prepare Claude Code review instructions before archive or push.
