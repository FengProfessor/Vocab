# Plan: Deploy LingoPro lên Hetzner (thay Vercel)

**Ngày:** 2026-07-21  
**Phạm vi:** Chỉ thay **host Next.js** (Vercel → Hetzner VPS).  
**Không đụng:** Supabase Pro (Auth, Postgres, Storage, RLS, RPC).

---

## 0. Đọc usage Vercel → vì sao phải chuyển gấp

Số liệu team free (chu kỳ hiện tại):

| Metric | Đã dùng | Limit Hobby | % | Mức |
|--------|---------|-------------|---|-----|
| **Fluid Active CPU** | **3h 55m** | 4h | **~98%** | 🔴 Sắp pause |
| Edge Requests | 798K | 1M | 80% | 🟠 |
| Function Invocations | 706K | 1M | 71% | 🟠 |
| Fast Origin Transfer | 5,64 GB | 10 GB | 56% | 🟡 |
| Fluid Provisioned Memory | 98,7 / 360 GB-Hrs | — | 27% | 🟢 |
| Fast Data Transfer | 11,5 / 100 GB | — | 12% | 🟢 |
| Cron Job Invocations | 29 | — | OK | 🟢 |

**Kết luận từ data:**

1. **CPU function là nút thắt**, không phải bandwidth. Đúng kiểu LingoPro: `image-proxy`, `tts`, dictionary API, AI routes.
2. **~700k function invocations** — server-side rất “nóng”; VPS fixed-cost thắng free/pro serverless ở profile này.
3. Build 19h+ CPU minutes — dev/deploy nhiều; trên VPS build local/CI riêng, không đếm vào host runtime.
4. **Hành động ngay:** cutover host trước khi CPU chạm 4h (site pause).

**Không làm trong plan này:** migrate DB, đổi Auth, multi-nick free.

---

## 1. Kiến trúc sau cutover

```
User / Capacitor (https://lingopro.online)
        │
        ▼
┌───────────────────────────┐
│  Hetzner VPS (CX33)       │
│  Caddy/Nginx → Next.js    │
│  :443 SSL                 │
│  cron → /api/cron/...     │
└─────────────┬─────────────┘
              │ HTTPS
              ▼
┌───────────────────────────┐
│  Supabase Pro (GIỮ)       │
│  Auth · Postgres · Storage│
└───────────────────────────┘
```

| Thành phần | Trước | Sau |
|------------|-------|-----|
| Next.js app | Vercel | **Hetzner Docker / Node** |
| Domain SSL | Vercel | **Caddy hoặc Nginx + Let’s Encrypt** |
| Cron `check-expired` | `vercel.json` 19:00 UTC | **systemd timer / crontab curl** |
| Supabase | Pro | **Pro (không đổi)** |
| Env secrets | Vercel Dashboard | **`.env` trên VPS (chmod 600)** |

---

## 2. Chọn máy Hetzner

| Gói | Spec | ≈ VNĐ/tháng | Khi nào |
|-----|------|-------------|---------|
| CX23 | 2 vCPU · 4 GB · 40 GB | ~105k | Chỉ smoke test |
| **CX33** ⭐ | **4 vCPU · 8 GB · 80 GB** | **~180k** | **Production khuyến nghị** |
| CX43 | 8 vCPU · 16 GB | ~360k | Sau khi RAM/CPU full |

- **Location:** `Singapore` (user VN) hoặc `Falkenstein` nếu rẻ/ổn latency.
- **OS:** Ubuntu 24.04 LTS.
- **IPv4:** bật (domain A record).

**Sizing vs usage Vercel:**  
798k edge + 706k functions ≈ tải vừa; 8 GB RAM đủ Next standalone + reverse proxy + headroom build trên máy (hoặc build CI → image).

---

## 3. Chiến lược deploy (chọn 1)

### Option A — Coolify (nhanh, ít CLI) ⭐ nếu quen GUI

1. One-click app Coolify trên Hetzner (hoặc cài Coolify lên VPS).
2. Connect GitHub repo `web-app`.
3. Buildpack/Dockerfile Next, env paste, domain + SSL auto.
4. Cron trong Coolify scheduled job.

**Ưu:** ship 1 ngày. **Nhược:** abstraction, debug container cần quen.

### Option B — Docker Compose + Caddy (kiểm soát, khuyến nghị long-term)

```
/opt/lingopro/
  docker-compose.yml
  Caddyfile
  .env                 # secrets, 600
  app/                 # hoặc pull image từ GHCR
```

**Dockerfile (outline):** multi-stage `next build` → `node server.js` (standalone).

**Ưu:** rõ ràng, dễ backup. **Nhược:** setup tay lần đầu.

### Option C — Node bare-metal (PM2)

`git pull` → `npm ci` → `npm run build` → `pm2 start`.  
Đơn giản nhưng bẩn hơn Docker khi scale/rollback.

**Quyết định mặc định plan:** **B (Docker + Caddy)**; nếu muốn tối đa tốc độ ngày 1 → **A**.

---

## 4. Timeline (1–2 ngày làm việc)

### Ngày 0 — Chuẩn bị (máy local / song song Vercel còn sống)

| # | Task | Done |
|---|------|------|
| 0.1 | Export **toàn bộ env** từ Vercel → file local an toàn (không commit) | ☐ |
| 0.2 | Bật `output: 'standalone'` trong `next.config` nếu chưa (deploy Docker gọn) | ☐ |
| 0.3 | Viết `Dockerfile` + `docker-compose.yml` + `Caddyfile` trong repo | ☐ |
| 0.4 | Build local Docker, `curl localhost:3000` health | ☐ |
| 0.5 | List checklist test (mục 7) | ☐ |
| 0.6 | **Tạm giảm CPU Vercel:** tắt bot prod, delay presence nếu cần sống thêm ngày | ☐ |

### Ngày 1 — VPS + staging

| # | Task | Done |
|---|------|------|
| 1.1 | Tạo CX33, SSH key, firewall (22, 80, 443 only) | ☐ |
| 1.2 | Cài Docker + Compose plugin | ☐ |
| 1.3 | Deploy stack lên VPS (subdomain tạm: `staging.lingopro.online` hoặc IP) | ☐ |
| 1.4 | Paste `.env`, restart container | ☐ |
| 1.5 | SSL staging | ☐ |
| 1.6 | Chạy checklist test trên staging | ☐ |
| 1.7 | Cấu hình cron trên VPS (chưa cắt Vercel cron) | ☐ |

### Ngày 1–2 — Cutover DNS

| # | Task | Done |
|---|------|------|
| 2.1 | Hạ TTL DNS `lingopro.online` còn 300s (trước cutover ≥1h) | ☐ |
| 2.2 | Đổi **A record** → IP Hetzner | ☐ |
| 2.3 | Caddy issue cert production domain | ☐ |
| 2.4 | Smoke test production (mục 7) | ☐ |
| 2.5 | Xác nhận webhook SePay/billing hit host mới | ☐ |
| 2.6 | Capacitor / app mobile mở đúng site | ☐ |
| 2.7 | **Giữ Vercel** 48–72h (rollback DNS nếu cháy) | ☐ |
| 2.8 | Sau ổn: xóa/pause project Vercel (tránh double cron / nhầm env) | ☐ |

**Rollback:** trỏ lại A record về Vercel (nếu project còn). TTL thấp = rollback nhanh.

---

## 5. Env checklist (copy từ Vercel → VPS)

**Bắt buộc**

| Key | Ghi chú |
|-----|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Giữ nguyên project Pro |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only |
| `CRON_SECRET` | Cron VPS phải gửi header giống Vercel |
| `WEBHOOK_SECRET` / billing keys | SePay/Casso/PayOS |
| `BOT_SECRET` | Nếu còn bot (nên off prod) |
| `ZHIPU_API_KEY` / AI keys | |
| `PIXABAY_KEY` / `PEXELS_KEY` | |
| Bank `NEXT_PUBLIC_BANK_*` | QR upgrade |
| Firebase `NEXT_PUBLIC_FIREBASE_*` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` | Push |
| `UPSTASH_REDIS_*` | Rate limit (nếu prod bắt buộc) |
| `ENTITLEMENT_ENFORCED` | Giống Vercel |

**Tuỳ chọn:** PostHog, Resend, Telegram, extension IDs, desktop download URLs.

**Supabase Dashboard (không phải env host):**

- Auth → Redirect URLs: vẫn `https://lingopro.online/**` (domain không đổi).
- Nếu thêm staging: thêm `https://staging.lingopro.online/**`.

---

## 6. Cron (thay `vercel.json`)

Hiện tại:

```json
{ "path": "/api/cron/check-expired", "schedule": "0 19 * * *" }
```

Trên VPS (crontab root hoặc user app), **19:00 UTC**:

```bash
0 19 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  https://lingopro.online/api/cron/check-expired >> /var/log/lingopro-cron.log 2>&1
```

Kiểm tra thêm route: `push-due`, `email-due` — nếu từng gọi tay/ngoài Vercel, schedule tương tự.

**Lưu ý:** Trong cửa sổ dual-run (Vercel + VPS cùng domain chỉ 1 bên nhận traffic) — **chỉ 1 cron** active để tránh double expire logic.

---

## 7. Checklist test (staging rồi prod)

| # | Case | Pass |
|---|------|------|
| T1 | `/` load, HTTPS OK | ☐ |
| T2 | Login / logout (Supabase Auth) | ☐ |
| T3 | OAuth callback nếu dùng Google | ☐ |
| T4 | Dashboard student + flashcard (ảnh `image-proxy`) | ☐ |
| T5 | Dictionary lookup + TTS | ☐ |
| T6 | `/upgrade` + tạo order | ☐ |
| T7 | Webhook thanh toán test / log nhận | ☐ |
| T8 | Cron dry-run với `CRON_SECRET` | ☐ |
| T9 | FCM register (nếu dùng) | ☐ |
| T10 | Extension / CORS API nếu cần | ☐ |
| T11 | Mobile Capacitor mở `lingopro.online` | ☐ |

---

## 8. Firewall & bảo mật VPS

```
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

- SSH key only, disable password login.
- `.env` mode `600`, ngoài git.
- Fail2ban (optional).
- Backup: snapshot Hetzner weekly + export env encrypted offline.
- **Không** mở port Postgres — DB ở Supabase.

---

## 9. CI / deploy sau cutover

| Cách | Mô tả |
|------|--------|
| **Simple** | SSH + `git pull` + `docker compose up -d --build` |
| **Better** | GitHub Actions → build image → push GHCR → VPS pull |
| **Coolify** | Auto deploy on push main |

Preview URL kiểu `*.vercel.app` **mất** — dùng branch staging subdomain nếu cần.

---

## 10. Chi phí sau cutover (ước VNĐ)

| Hạng mục | /tháng |
|----------|--------|
| Supabase Pro | ~660.000đ |
| Hetzner CX33 | ~180.000đ |
| Vercel | **0đ** |
| **Tổng** | **~840.000đ** |

So: Supabase Pro + Vercel Pro ≈ **1,18 triệu** + usage.  
Hetzner path **rẻ hơn** và **không hard-pause** 4h CPU.

---

## 11. Rủi ro & mitigation

| Rủi ro | Mitigation |
|--------|------------|
| DNS / SSL lệch | Staging trước; TTL thấp; giữ Vercel 72h |
| Thiếu env | Diff checklist vs Vercel dashboard 100% |
| Webhook fail | Monitor log orders sau cutover 24h |
| CPU/RAM VPS | CX33; `docker stats`; nâng CX43 nếu cần |
| Double cron | Tắt Vercel cron / xóa project sau ổn |
| App store / Capacitor | Domain giữ nguyên → không rebuild app |

---

## 12. Việc **không** nằm trong plan

- ❌ Migrate Postgres / Auth / Storage khỏi Supabase  
- ❌ Multi account free Vercel  
- ❌ Tối ưu image-proxy sâu (làm **song song** hoặc phase 2 — giảm tải VPS tốt nhưng không chặn cutover)

**Phase 2 (sau khi host ổn):** cache TTS, bypass proxy ảnh CDN, tăng presence interval — giảm cost CPU trên VPS (bill máy vẫn cố định).

---

## 13. Definition of Done

- [ ] `https://lingopro.online` resolve → Hetzner, SSL xanh  
- [ ] Login + upgrade + webhook + cron OK  
- [ ] Supabase vẫn project Pro cũ  
- [ ] Vercel không còn traffic production (hoặc đã pause)  
- [ ] Snapshot VPS + env backup có  
- [ ] Doc này cập nhật IP/region/gói đã chọn  

---

## 14. Next action (implement) — ĐÃ XONG phần repo

| Artifact | Path |
|----------|------|
| standalone | `next.config.ts` → `output: 'standalone'` |
| Docker | `Dockerfile`, `.dockerignore`, `docker-compose.yml` |
| TLS | `deploy/Caddyfile` |
| Bootstrap VPS | `deploy/bootstrap-vps.sh` |
| Cron | `deploy/install-cron.sh` |
| Update | `deploy/update.sh` |
| Push từ Windows | `deploy/push-to-vps.ps1` |
| Env | `.env.hetzner` (local, gitignored) |
| **Bạn chỉ làm** | `docs/BAN-CHI-CAN-LAM.md` |

**Còn lại (người):** thuê VPS → `push-to-vps.ps1 -Ip …` → DNS A.

**Ưu tiên:** Fluid CPU gần trần — cutover host trước tối ưu micro.
