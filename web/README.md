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

- `/`: project foundation page that loads CPID710R8 mock project data through the project service.
- `/admin`: placeholder route only. It does not provide edit, save, authentication, or CloudBase write behavior.

## Data Source Boundary

The UI must read project progress data through `src/services/projectService.ts`.

The default implementation uses `MockProjectRepository` in `src/services/projectRepository.ts`, which reads from `src/data/cpid710r8Mock.ts`.

Future backend or CloudBase work should replace the repository implementation while preserving the service contract:

```ts
export interface ProjectRepository {
  getProject(): Promise<Project>;
  listTaskInputs(): Promise<ProjectTaskInput[]>;
}
```

This keeps display components independent from mock data, local persistence, or CloudBase storage details.

## CloudBase Status

This foundation does not require CloudBase credentials. It must run with mock data when CloudBase configuration is absent.

Real CloudBase schema, environment variables, credentials, and connectivity checks belong to the `cloudbase-persistence` change. Do not commit real CloudBase secrets to this repository.
