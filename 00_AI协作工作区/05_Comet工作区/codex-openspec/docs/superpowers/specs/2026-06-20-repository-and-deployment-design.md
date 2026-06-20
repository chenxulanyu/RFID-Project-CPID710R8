---
comet_change: repository-and-deployment
role: technical-design
canonical_spec: openspec
---

# Repository And Deployment Design

## Context

This change prepares the CPID710R8 project website for repository handoff and manual deployment. The website implementation already lives under `web/`, with React, Vite, TypeScript, Vitest, local fallback data, and optional Tencent CloudBase persistence. The user will manually deploy through Coze and may later provide GitHub/Gitee account details, but this change must not create remotes, push code, deploy, or store credentials.

The OpenSpec delta spec remains the source of truth for scope. This design only defines the implementation approach for repository and deployment readiness artifacts.

## Chosen Approach

Use lightweight documentation completion.

The implementation will add or update documentation and checklists while reusing existing technical sources:

- Root-level README for project purpose, directory structure, local setup, validation commands, CloudBase safety boundary, and AI collaboration workflow.
- Deployment guide for GitHub/Gitee preparation, Coze manual deployment, CloudBase runtime variables, and post-deployment verification.
- Release readiness checklist for local validation, frontend display, admin maintenance flow, CloudBase connectivity, environment configuration, and sensitive file review.
- Existing `web/README.md` remains the detailed web-app technical guide.
- Existing `web/.env.example` remains the placeholder-only CloudBase environment template.
- Existing root `.gitignore` remains the primary local secret/build-output exclusion point, with small additions only if gaps are found.

## Rejected Alternatives

Platform-specific deployment package:
This would add dedicated configuration files for Coze, GitHub, or Gitee. It is premature because the user plans to deploy manually and the exact Coze deployment path can vary.

Automated publish/deploy scripts:
This would add scripts for remote creation, push, or deployment. It is out of scope because external operations require explicit user authorization and credentials. Scripts could also encourage accidental secret usage.

## Artifact Layout

Recommended repository artifacts:

- `README.md`: project-level entry point for maintainers and repository viewers.
- `docs/deployment.md`: deployment and repository handoff instructions.
- `docs/release-readiness-checklist.md`: checklist used before GitHub/Gitee push or Coze deployment.
- Existing `web/README.md`: web application local development and CloudBase details.
- Existing `web/.env.example`: placeholder-only frontend environment variables.

The docs directory is appropriate because the existing IPD stage folders should not be rearranged, and AI collaboration records stay under `00_AI协作工作区/`.

## Data And Secret Boundary

Committed files must contain only placeholder values for configuration. Frontend CloudBase variables may include environment names and publishable/public access key placeholders, but must not include server-side `secretId`, `secretKey`, repository tokens, Coze deployment keys, or personal access tokens.

The implementation should document that real values belong in the deployment platform environment settings or a local untracked `.env` file. It should also document that Codex must pause before any external repository or deployment operation.

## Verification Strategy

Implementation verification will include:

- `cd web && npm test`
- `cd web && npm run build`
- Documentation consistency check against `web/package.json` scripts and `web/.env.example` variable names.
- Sensitive-value scan for common forbidden credential names and token-like files in committed changes.
- Manual review of release checklist coverage against the OpenSpec requirements.

## Spec Patch

No OpenSpec patch is required. The current delta spec already covers repository readiness documentation, secret exclusion, deployment instructions, authorized external operations, and release readiness checklist.
