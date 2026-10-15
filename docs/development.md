> Purpose: configure a local LingoPro checkout with isolated development services.

# Local development

## Prerequisites

- Node.js **22**, matching GitHub Actions and the Docker build.
- npm; use the committed `package-lock.json` with `npm ci`.
- A dedicated development Supabase project for account and database features.
- An isolated Upstash Redis REST instance for server-side authentication sessions.

## Install

```bash
git clone https://github.com/FengProfessor/Vocab.git
cd Vocab
npm ci
```

## Configure services

Create `.env.local` in the repository root. This file is ignored by Git. Obtain credentials for development services; do not copy production credentials.

Some clients retain fallback service configuration in source. Set the Supabase variables explicitly before using data or account features so the checkout targets your own development project.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Local origin, normally `http://localhost:3000`. |
| `NEXT_PUBLIC_SUPABASE_URL` | URL of your development Supabase project. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public key for that development project. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only development service credential. Never expose it through a `NEXT_PUBLIC_` variable. |
| `UPSTASH_REDIS_REST_URL` | REST endpoint of your development Redis instance. |
| `UPSTASH_REDIS_REST_TOKEN` | Server-only token for that Redis instance. |
| `AUTH_SESSION_ENCRYPTION_KEY` | Local session encryption key: exactly 64 hexadecimal characters. |

Generate a new local encryption key:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copy the generated value into `.env.local`. Keep it private; changing it invalidates sessions encrypted with the previous key.

The table covers the account/session foundation. Supabase schema, seed data and providers must also be configured for the features you exercise. Review [database migrations](operations/database-migrations.md) before preparing a development database; a fresh clone does not provision or seed services automatically.

### Optional integrations

The app also integrates AI providers, Firebase notifications, payment services and analytics. Configure only the features you are working on, using development credentials. Refer to the relevant module and service guide rather than copying a full production environment.

| Integration | Relevant implementation |
| --- | --- |
| Gemini and AI routing | [`src/lib/gemini-multi.ts`](../src/lib/gemini-multi.ts), [`src/lib/ai-router.ts`](../src/lib/ai-router.ts) |
| Firebase notifications | [`src/lib/firebase.ts`](../src/lib/firebase.ts), [`src/lib/firebase-public-config.ts`](../src/lib/firebase-public-config.ts) |
| Payment webhook | [SePay setup](sepay-webhook-setup.md) |

## Start

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000). Missing session configuration causes authenticated operations to fail closed. An anonymous page rendering successfully does not verify account, AI or notification setup.

## Validate a change

| Command | Checks |
| --- | --- |
| `npm run lint` | ESLint across application source. |
| `npm run typecheck` | TypeScript diagnostics. |
| `npm run build` | Production application build. |
| `npm run test:e2e:smoke` | Chromium-based anonymous browser smoke against a local production build. Run the build first. |

Use focused suites from `tests/` for the area you change. The [test classification](testing/test-classification.md) documents existing lint/typecheck debt and the difference between fixtures, integration tests and real browser coverage. Record new failures separately from the existing baseline.

Local development does not authorize production deployment or database changes. Follow [CONTRIBUTING.md](../CONTRIBUTING.md) and the canonical [release runbook](operations/production-deploy.md) for those operations.
