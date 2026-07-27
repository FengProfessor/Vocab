# Core senses burn — always-on (2026-07-15)

## Provider
- **Default: OpenRouter free** (`openrouter/free`) via `OPENROUTER_API_KEY`
- Fallback: `--provider=glm` + `ZHIPU_API_KEY` (dang 429)
- 429 = soft backoff (khong exit 42); 401/403 = hard exit 42

## Stack (3 lop)
1. **Task Scheduler** `LingoProGLMBurnWatchdog` — moi 1 phut `scripts/glm-watchdog.ps1`
2. **Super watchdog** `scripts/glm-super-watchdog.mjs` — moi 60s
3. **Parent** `scripts/glm-burn-parent.mjs` — 2 shard, delay 1200ms, auto-restart

## Env parent
- `CORE_SENSES_PROVIDER=openrouter`
- `BURN_SHARDS=2` `BURN_DELAY_MS=1200` `OPENROUTER_MODEL=openrouter/free`

## Logs
- `scripts/logs/watchdog.log` / `super-watchdog.log` / `parent.log` / `forever-w0.log` …
