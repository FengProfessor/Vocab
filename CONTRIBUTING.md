# Contributing to LingoPro

Focused bug reports, usability improvements, documentation fixes, and tested code changes help keep LingoPro useful for learners and teachers.

## Before you start

- Search existing issues and pull requests for related work. Open an issue before a substantial feature or architectural change.
- Read [AGENTS.md](AGENTS.md) and the [README](README.md) for repository rules and local setup.
- Use Node.js 22, matching CI, and install the lockfile dependencies with `npm ci`. Keep credentials in local environment files; use a separate development backend for work that needs Supabase.
- Never include tokens, service-role keys, real learner records, or private recordings in code, logs, screenshots, or issue reports.

## Make a focused change

Create a branch from `main` and keep each pull request centered on one problem. Follow the surrounding TypeScript and component conventions; avoid unrelated formatting or dependency updates. For a visible UI change, include a screenshot and check both mobile and desktop layouts.

Database changes need a new SQL file in `supabase/migrations/`. Do not edit an applied migration. Follow the [migration runbook](docs/operations/database-migrations.md), including registration in the runner when applicable, and explain the impact on existing data and access policies.

## Verify and report results

Choose checks that exercise the affected behavior. For application changes, start with:

```bash
npm run typecheck
npm run build
npm run test:e2e:smoke
```

Run ESLint against the source files you changed and any relevant feature or security tests. [Test classification](docs/testing/test-classification.md) explains the available suites and their limits; some integration tests need isolated PostgreSQL or Redis services.

The repository has existing full-lint debt and a committed [TypeScript diagnostic baseline](tests/security/typecheck-baseline.txt). Report the commands, results, and any new diagnostics accurately. Do not disable checks or update the baseline merely to hide a regression. The browser smoke suite covers anonymous local flows; it does not establish authenticated learning or database persistence.

For documentation-only changes, check relative links and `git diff --check`; application tests are unnecessary unless behavior also changes.

## Open a pull request

Explain the problem, resulting behavior, and validation evidence. Link the related issue when there is one. Note any migration, new environment variable, operational impact, or limitation that a reviewer needs to assess.

Production access and deployment require explicit operator approval. A push to `main` triggers the [canonical deployment workflow](.github/workflows/deploy-server.yml): quality checks, migrations, exact-commit activation, restart, and health checks. Follow the [deployment runbook](docs/operations/production-deploy.md); never bypass it with a manual SSH deployment or a legacy script.
