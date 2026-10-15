> Purpose: track repository-presentation work separately from the production release log in root `progress.md`.

# Repository presentation work log

## 2026-10-15 — Initial presentation

- Branch `codex/professional-repository`: rebuilt English README and added Vietnamese mirror, original SVG hero, real anonymous homepage WebP capture, verified feature/stack overview and project map.
- Added docs index, isolated local development setup, contribution guide, bug/feature issue forms and pull request template. Application source, migrations and workflows unchanged.
- Updated GitHub About description, eight relevant topics and homepage to `https://lingopro.online`.
- Validation: independent factual/link review PASS; YAML issue-form structure and SVG XML PASS; desktop 1200px/mobile 390px README preview with no broken images or horizontal overflow PASS; whitespace PASS. New assets total 64,656 bytes.
- `npm run typecheck`: exit 2, exactly matches committed 10-error Speaking baseline. `npm run lint`: exit 1, existing source has 147 errors/494 warnings (57 files with errors). No production build or authenticated browser suite run for documentation-only changes.
- Opened draft [PR #25](https://github.com/FengProfessor/Vocab/pull/25). Merging `main` triggers production and requires explicit operator approval. No deployment triggered by this work.

## 2026-10-15 — Rescan

- Synced the five newer `main` commits through `1e9c76e`; preserved the full production log. Moved only this PR's checkpoint from root `progress.md` into this file to avoid repeated append conflicts with release work.
- Replaced obsolete manual production deployment instructions in `GEMINI.md`; clarified historical results in `PROJECT.md`, `TEST_READY.md` and `TEST_INFRA.md`; classified the offline suite as contract/fixture.
- Recorded tracked scratch/tmp/root-output findings and remaining ownership decisions in the [rescan report](repository-presentation-2026-10-15.md). No existing scripts or artifacts removed or untracked.
- Validation: independent factual/link review PASS; Markdownlint for report/index PASS; documentation link/fence/conflict-marker checks PASS; PR whitespace check PASS. Public branch images and technology/release badges return HTTP 200.
- Latest `npm run typecheck` after syncing `main`: exit 2, exactly the committed 10-error baseline. Earlier application lint results above remain historical; no new application lint-clean claim.
- Updated the existing draft PR; did not merge `main`, deploy, run migrations or access the production host.
