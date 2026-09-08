# Project Guidelines & Rules

## 1. Zero-Downtime Atomic Swaps for Next.js Standalone Deployments
- **Never build in-place on production**: Never run `npm run build` or delete `.next/` inside the active directory of a running Next.js standalone service (`lingopro.service`).
- **Out-of-place / Staging Build**: Always build in a separate build directory (`~/Vocab-build`).
- **Atomic Directory Swap**: Once the standalone bundle and static assets are prepared, swap `.next` atomically:
  ```bash
  rm -rf .next.new
  cp -r /path/to/build/.next .next.new
  mv .next .next.old && mv .next.new .next
  sudo systemctl restart lingopro.service
  rm -rf .next.old
  ```
- **Failure Isolation**: A failed build in staging must abort before touching the active service directory, ensuring production remains 100% available with the prior working build.
