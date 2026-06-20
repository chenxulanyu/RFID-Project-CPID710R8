# CPID710R8 Project Web

React + Vite + TypeScript foundation for the CPID710R8 project progress website.

## Local Development

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Build static assets:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Current Routes

- `/`: project foundation page that loads CPID710R8 project data through the project service.
- `/dashboard`: project progress dashboard.
- `/admin`: project progress maintenance page for metadata and task updates.

## Data Source Boundary

The UI reads and writes project progress data through `src/services/projectService.ts`,
`src/services/projectAdminService.ts`, and the `ProjectRepository` interface in
`src/services/projectRepository.ts`.

Available repository implementations:

- `LocalProjectRepository`: mock/localStorage-backed data for development, review, and demo.
- `CloudBaseProjectRepository`: Tencent CloudBase-backed project metadata and task data.

React components must not import CloudBase SDK directly.

## CloudBase Configuration

Copy `web/.env.example` to a local `.env` file when configuring CloudBase. Keep real
values out of Git.

Required frontend-safe variables for CloudBase mode:

- `VITE_PROJECT_DATA_SOURCE=cloudbase`
- `VITE_CLOUDBASE_ENV_ID`
- `VITE_CLOUDBASE_ACCESS_KEY` for the Web SDK Publishable Key when required
- `VITE_CLOUDBASE_PROJECT_ID`
- `VITE_CLOUDBASE_PROJECTS_COLLECTION`
- `VITE_CLOUDBASE_TASKS_COLLECTION`

Do not add `secretId`, `secretKey`, or other server-side credentials to Vite frontend
environment variables. Browser direct access also requires CloudBase console setup for
allowed origins or security domains, authentication mode, and database permission rules
before enabling write access.

When CloudBase config is absent or `VITE_PROJECT_DATA_SOURCE=local`, the app falls back
to local data and does not require CloudBase credentials.

## CloudBase Verification

Before production deployment:

1. Configure CloudBase allowed origins/security domains for the deployed website.
2. Configure authentication and database permission rules for project reads and admin writes.
3. Set the Vite variables in the deployment platform.
4. Use non-sensitive test data to confirm project read, task update, archive, and restore
   behavior from `/admin`.
