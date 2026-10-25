# Báo cáo: Redesign `/download` — LingoPro Desktop

**Ngày:** 2026-07-14  
**Phạm vi visual:** **chỉ in-app** (student/teacher shell) — **không** bám landing cream.  
**Nguồn:** NotebookLM research (`cfc7d8e0-dbaa-43d0-82c9-8ed2ab3e56fc`, 10 sources) + audit `/download` + GitHub `desktop-v0.1.4` + `StudentShell` / student dashboard tokens.

---

## 1. Hiện trạng trang

| Hạng mục | Giá trị hiện tại |
|---|---|
| File | `src/app/download/page.tsx` |
| Version | `0.1.4` |
| CTA chính | Zip `LingoPro-Desktop-0.1.4-Windows.zip` (~92 MB, 13 downloads) |
| Asset phụ (chưa expose) | `Setup.exe` NSIS (~92 MB, 0 downloads trên API) |
| Preview | `/downloads/desktop/desktop-preview.png` — **320×130**, quá nhỏ cho hero |
| Palette | Emerald + slate (`#f7faf7`, `emerald-600`) — **lệch in-app** indigo/violet |
| Font | Inter (ok — trùng root layout) |
| Header | Logo text + “Lấy token” — **không** khớp logo/sidebar app (`from-indigo-500 to-violet-500`) |

### Cấu trúc hiện tại
1. Header minimal  
2. Hero 2 cột (copy + preview)  
3. 4 bước cài (gồm SmartScreen)  
4. Sau khi cài + link GitHub an toàn  

### Điểm ổn
- Có hướng dẫn SmartScreen (unsigned) — đúng pain point Windows  
- 4 bước cài rõ  
- Có usage tips sau cài  
- Link release GitHub minh bạch  

### Gap lớn (so best practice + brand)

| # | Gap | Ảnh hưởng |
|---|---|---|
| 1 | **Brand lệch in-app** emerald ≠ indigo/violet (`#4f46e5`, logo gradient) | User từ `/student` → Download thấy “app khác” |
| 2 | **Preview 320×130** | Hero “trống”, không chứng minh sản phẩm |
| 3 | **Không metadata file** (OS / version / size) dưới CTA | User không biết tải gì, bao nhiêu MB |
| 4 | **CTA zip** trong khi đã có `Setup.exe` | Thêm 1 bước giải nén = ma sát |
| 5 | **Token flow mơ hồ** — “Lấy token” header, bước 4 dán `lpext_` nhưng không deep-link `/student/profile` hoặc hướng dẫn 3 click | Drop sau cài |
| 6 | **4 bước cài** — research khuyến nghị gói **3 bước** + SmartScreen gộp note, không thành step riêng chiếm 25% list | Dài hơi |
| 7 | **Raw GitHub URL block** (dark code box) | Dev-ish, không cần trên marketing page |
| 8 | **Không system requirements** (Win 10/11 x64) | Thiếu trust/tech clarity |
| 9 | **Không sticky secondary CTA** / footer download | User scroll xuống cài xong phải cuộn lại |
| 10 | **Screenshot assets sẵn** trong `desktop-app/docs/usage/` (main-panel-vi, pet-bubble, settings) **chưa dùng** trên web | Lãng phí proof |

---

## 2. Best practices (NotebookLM — 10 sources)

### Thứ tự section ưu tiên conversion
1. **Hero above-the-fold** — value prop + 1 primary CTA + meta file + product visual  
2. **Trust strip** — OS support, official release, SmartScreen honesty (không giấu)  
3. **Feature chips / how it works** (3 điểm, không essay)  
4. **Install in 3 steps** (ảnh/GIF nếu có)  
5. **First-run / connect account**  
6. **FAQ ngắn** (SmartScreen, token, gỡ PWA cũ)  

### Hero
- **1 primary CTA** contrast cao — secondary text link, không cạnh tranh màu  
- Meta dưới CTA: `Windows 10/11 · v0.1.4 · ~92 MB`  
- Detect OS (optional): “Tải cho Windows” — ẩn/disable Mac nếu chưa có  
- Screenshot **sắc, lớn**, mock device/window frame  

### Trust Windows / SmartScreen
- Unsigned = rào cản cài thật  
- Long-term: **Authenticode code-sign** + reputation  
- Short-term UX: note SmartScreen **More info → Run anyway** (đã có — giữ, style lại)  
- Prefer **Setup.exe** (1 click) hơn zip+extract  
- Link GitHub release = transparency (1 link “Xem release”, không dump URL thô)  

### Install UX
- Rút **3 bước**: Tải → Chạy Setup → Đăng nhập / dán token  
- Prerequisites 1 dòng: Win 10/11 x64, ~100 MB trống  

### First-run
- Không bắt form dài trước khi thấy value  
- Token: deep-link rõ “Lấy token trong web → Cài đặt app → Dán”  
- (Ideal sau) SSO / deep-link `lingopro://` — out of scope UI pass  

### Visual hierarchy — chọn **In-app light dashboard** (khớp student shell)
- Canvas `bg-muted/40` (hoặc `#f7f8fc` / white strip)  
- Primary indigo/violet: logo `from-indigo-500 to-violet-500`, CTA `bg-primary` / `#4f46e5`  
- Card white + border nhẹ `#ececf1`, `rounded-2xl` / `rounded-[11px]`  
- Font Inter (`font-sans`), `font-black` titles như dashboard  
- **Không** cream landing, **không** Raycast pure-black  

### Anti-patterns tránh
- Competing CTAs cùng weight  
- Unsigned + im lặng về SmartScreen  
- Bắt login web trước khi cho tải  
- Preview mờ / quá nhỏ  
- Nhồi pricing full table trên download page  

---

## 3. Wireframe đề xuất (khớp landing)

### Desktop (2 cột) — token in-app

```
[Header app-style]
  [icon Brain gradient indigo→violet] LingoPro
  link: ← Về Dashboard (/student) | Lấy token (/student/profile)

HERO  bg-muted/40
  LEFT                              RIGHT
  Badge: Windows · v0.1.4           [Card white / slate-950 preview frame]
  H1 font-black                     [Screenshot lớn]
  Sub text-muted-foreground
  [CTA primary indigo] Tải Setup.exe
  meta: Win 10/11 · ~92 MB
  3 check chips (tile style như nav)

TRUST: Win 10/11 | GitHub official | SmartScreen note

FEATURES: 3 white cards (double-click / hotkey / SRS+pet)

INSTALL: 3 steps numbered bg-primary/10 text-primary
  + amber SmartScreen callout

TOKEN: card hướng dẫn → /student/profile

FOOTER CTA primary lặp
```

### Mobile (1 cột)
Header app → H1 → CTA → meta → preview → chips → steps → token → footer

---

## 4. Asset cần chuẩn bị

| Asset | Status | Action |
|---|---|---|
| `desktop-preview.png` 320×130 | ❌ yếu | Export hero ≥ 1200×800 từ `main-panel-vi.png` + pet |
| `main-panel-vi.png` | ✅ có trong desktop-app | Copy vào `public/downloads/desktop/` |
| `pet-bubble.png` | ✅ | Dùng feature card / overlay |
| `settings-language-vi.png` | ✅ | Bước “dán token” |
| Setup.exe link | ✅ release | **Primary CTA** |
| Zip link | ✅ | Secondary “Tải bản .zip” |
| File size | ~92 MB | Hiện `~92 MB` |

---

## 5. Checklist implement (UI pass)

**Must (căn in-app + conversion)**
- [ ] Palette/logo/CTA = student shell (indigo/violet, `bg-muted/40`, white cards)  
- [ ] Primary CTA → `Setup.exe`; secondary → zip / release  
- [ ] Meta: Windows 10/11 · v0.1.4 · ~92 MB  
- [ ] Preview lớn (export từ `main-panel-vi.png`)  
- [ ] 3 bước cài; SmartScreen = callout  
- [ ] Deep-link token → `/student/profile` (fallback `/auth`)  
- [ ] Bỏ raw URL dump; 1 link GitHub release  
- [ ] Link “← Dashboard” về `/student`  
- [ ] Footer CTA lặp

**Should**
- [ ] Feature 3 cards từ usage guide  
- [ ] FAQ 3 câu (SmartScreen, token, PWA cũ vs Desktop)  
- [ ] JSON-LD `SoftwareApplication` download  

**Later (product, không chỉ UI)**
- [ ] Code-sign Authenticode  
- [ ] Stub installer nhỏ  
- [ ] Deep link `lingopro://auth?token=`  

---

## 6. Copy đề xuất (VI)

**H1:** Tra từ trên mọi app Windows — lưu thẳng vào LingoPro  
**Sub:** Double-click hoặc `Ctrl+Shift+L`. Nghĩa Việt + IPA, lưu 1 chạm vào lịch FSRS.  
**CTA:** Tải cho Windows · Setup.exe  
**Secondary:** Hướng dẫn cài · Tải bản .zip  
**SmartScreen:** Bản chưa code-sign. Nếu Windows chặn: **More info → Run anyway**. File chính thức từ GitHub release LingoPro.  
**Token:** Mở web LingoPro → Hồ sơ → sao chép token `lpext_…` → Settings trong app → Lưu.

---

## 7. Kết luận

Trang `/download` **đủ nội dung** nhưng **lệch in-app** (emerald vs indigo dashboard), **preview yếu**, **CTA zip**, **token mờ**.

Redesign (trong app only):
1. **Visual** = student shell: indigo/violet + `muted/40` + white cards.  
2. **Hero** = Setup.exe + meta + screenshot lớn.  
3. **3 bước cài + SmartScreen callout**.  
4. **Token** deep-link `/student/profile`.  

**Không** áp palette landing cream.  

Ước lượng: 1 file `download/page.tsx` + copy ảnh (~1–2h).

---

## Phụ lục

- NotebookLM: `cfc7d8e0-dbaa-43d0-82c9-8ed2ab3e56fc`  
- Conversation: `e4817c07-741f-4191-a2d4-930e01c57faa`  
- Live: https://lingopro.online/download  
- Release: https://github.com/FengProfessor/Vocab/releases/tag/desktop-v0.1.4  
- Guide: `desktop-app/USER_GUIDE.md`
