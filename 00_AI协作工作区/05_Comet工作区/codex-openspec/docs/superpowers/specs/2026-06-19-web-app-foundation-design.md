---
comet_change: web-app-foundation
role: technical-design
canonical_spec: openspec
archived-with: 2026-06-19-web-app-foundation
status: final
---

# Web App Foundation Technical Design

## Context

The CPID710R8 project schedule currently lives in `03_开发阶段/CPID710R8_项目进度管理.xlsx`. The workbook already defines the useful business shape: project period, task rows, planned dates, actual dates, duration calculations, completion ratio, warning states, owners, and remarks.

This change creates the website foundation only. It prepares the application shell, shared project progress model, mock data, and data access boundary that later changes will use for the dashboard, admin maintenance, CloudBase persistence, and deployment.

## Confirmed Stack

Use `React + Vite + TypeScript` as a static SPA.

This choice fits the user's deployment direction because the website can be built into static assets and deployed as a web app, while project data can be read through a later CloudBase adapter. Next.js remains a future option only if server-side rendering or server-hosted API routes become necessary.

## Architecture

The first implementation should create a `web/` application with clear boundaries:

```text
web/
├── src/
│   ├── app/              # routing, app shell, pages
│   ├── features/project/ # project progress feature components
│   ├── data/             # mock data and local data-source adapters
│   ├── services/         # project repository and project service
│   ├── types/            # Project, ProjectTask, WarningState, metrics
│   └── utils/            # date, duration, progress, warning helpers
```

Initial routes:

- `/`: minimal project foundation page that proves project data can load.
- `/admin`: placeholder route only. It must not implement real editing, saving, authorization, or CloudBase writes in this change.

## Data Model

The model should separate editable input fields from derived fields.

Editable project fields include project ID, project name, planned start date, planned end date, and metadata needed by the display layer.

Editable task fields include task ID, milestone code, project content, task name, planned start date, planned end date, actual start date, actual end date, resource owner, responsible person, and remarks.

Derived fields include planned duration, actual duration, elapsed working or calendar days, completion ratio, overdue days, and warning state. These should be calculated by utilities or services rather than hand-maintained in mock data or future CloudBase documents.

## Data Access

UI code should read project data through a service or repository contract. The initial repository implementation reads local mock data extracted from the current Excel schedule.

Later changes can replace the repository with:

- an admin-backed local or API repository from `admin-progress-backend`;
- a CloudBase repository from `cloudbase-persistence`.

Display components should not import raw mock data directly.

## Implementation Constraints

- Do not modify or reorganize existing IPD phase directories.
- Do not write real CloudBase credentials or deployment secrets.
- Do not implement dashboard, Gantt, mobile landscape behavior, real admin editing, CloudBase persistence, GitHub/Gitee push, or Coze deployment in this change.
- Follow the double-AI workflow. Implementation updates must maintain `00_AI协作工作区/03_版本迭代/VERSION.md` and `00_AI协作工作区/03_版本迭代/CHANGELOG.md`.
- When implementation reaches a coherent review point, tell the user it is ready to hand to Claude Code for review.

## Risks and Mitigations

- Excel formulas may not map one-to-one to website data fields.
  Mitigation: keep raw editable fields separate from derived calculations and add focused tests for derived helpers.

- The CloudBase schema may evolve later.
  Mitigation: use the TypeScript domain model and repository interface as the contract, not the mock file shape.

- The `/admin` placeholder could invite scope creep.
  Mitigation: keep it visibly read-only and route-only until `admin-progress-backend` is active.

- Static deployment may not support server-side secret logic.
  Mitigation: any future secret-bearing logic should live in CloudBase functions or another approved server-side environment, not in the static frontend.

## Testing Strategy

- Local startup: the app starts without CloudBase configuration.
- Build: the static build command succeeds.
- Model mapping: at least one CPID710R8 Excel task is represented as a structured `ProjectTask`.
- Data access boundary: UI reads through the project service/repository, not direct raw mock imports.
- Admin placeholder: `/admin` loads but provides no real edit or save capability.

## Spec Patch

No OpenSpec delta spec patch is required for this design.
