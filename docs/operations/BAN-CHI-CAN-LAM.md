# Bạn chỉ cần làm (Hetzner)

Mọi file deploy + export env đã có trong repo. **Chỉ 3 việc bắt buộc** cần bạn (tài khoản / tiền / DNS).

---

## 1. Thuê VPS Hetzner (~2 phút + thanh toán)

1. Vào https://console.hetzner.com → Cloud  
2. **Add Server**:
   - Location: **Singapore** (hoặc EU)
   - Image: **Ubuntu 24.04**
   - Type: **CX33** (4 vCPU / 8 GB) — hoặc CX23 thử
   - SSH key: thêm public key máy bạn
   - IPv4: bật  
3. Create → copy **IPv4**

Gửi IP cho AI hoặc tự chạy bước 2.

---

## 2. Đẩy app lên VPS (1 lệnh trên máy Windows)

Mở PowerShell tại `D:\Vocab\web-app`:

```powershell
.\deploy\push-to-vps.ps1 -Ip PASTE_IP_VÀO_ĐÂY
```

Script sẽ: upload code + `.env.hetzner` → cài Docker → build → Caddy → cron.

**Hoặc** nếu repo đã push GitHub public/private:

```powershell
.\deploy\push-to-vps.ps1 -Ip PASTE_IP -RepoUrl "https://github.com/BAN/web-app.git"
```

---

## 3. DNS (domain)

Tại chỗ quản lý DNS `lingopro.online`:

| Type | Name | Value |
|------|------|--------|
| **A** | `@` | `IP_VPS` |
| **A** | `www` | `IP_VPS` (optional) |

- Hạ TTL **300** trước khi đổi (nếu được)  
- Chờ SSL Let’s Encrypt (1–5 phút sau khi DNS trỏ đúng)  
- Mở https://lingopro.online → login thử  

---

## Sau khi ổn (48–72h)

- Vercel Dashboard → **pause / xóa** production (tránh double, hết CPU free)  
- Hetzner → **Snapshot** server 1 lần  

---

## Không cần làm

| Việc | Ai làm |
|------|--------|
| Export env Vercel | ✅ Đã (`.env.hetzner`) |
| Dockerfile / compose / Caddy / cron | ✅ Đã (`deploy/`, root) |
| Migrate Supabase | ❌ Không làm |
| Sửa code app | Không bắt buộc cho cutover |

---

## Nếu kẹt

| Triệu chứng | Check |
|-------------|--------|
| SSH fail | Key Hetzner, IP đúng, port 22 |
| SSL fail | DNS chưa trỏ / chưa propagate |
| 502 | `ssh root@IP "cd /opt/lingopro && docker compose logs app --tail=80"` |
| Login fail | Env Supabase trong `.env` trên VPS |

Khi có IP: chạy `push-to-vps.ps1` hoặc nhắn IP để AI hướng dẫn tiếp (AI không vào được console Hetzner/DNS hộ bạn).
