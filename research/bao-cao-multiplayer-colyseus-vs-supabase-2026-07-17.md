# Multiplayer LingoTown: vì sao “30 người × 20Hz → Colyseus move, Supabase data học”

**Ngày:** 2026-07-17  
**Câu hỏi:** Câu trong research “30 × 20Hz dễ vượt Supabase msg/s → Colyseus cho move; Supabase cho data học” nghĩa là gì?

**Nguồn limit (chính thức):** [Supabase Realtime Limits](https://supabase.com/docs/guides/realtime/limits)  
- Free: **100 messages/second**  
- Pro: **500 messages/second**  
- Pro no spend cap / Team: **2,500 messages/second** (+ cao hơn Enterprise)

**Colyseus:** game server room + **schema state + delta patch** (chỉ gửi phần state đổi), mặc định patch ~50ms (~20Hz) — [docs Phaser tutorial](https://docs.colyseus.io/learn/tutorial/phaser).

---

## 1. Hai loại dữ liệu realtime khác nhau

| Loại | Ví dụ LingoTown | Tần suất | Phù hợp |
|------|-----------------|----------|---------|
| **Hot path (game)** | `x, y, facing, anim` mỗi frame/tick | Rất cao (10–20 lần/giây/người) | Game server (Colyseus…) |
| **Cold path (học)** | Check-in, XP, SRS, rank, quest done, pair request | Thấp (vài lần/phút hoặc event) | **Supabase** (Postgres + Realtime optional) |

Câu research = **tách đường**:

```text
Phaser client
   │
   ├─ move/position  ──► Colyseus Room (game state)
   │
   └─ học xong / check-in / XP ──► Supabase (API + DB)  [đã có LingoPro]
```

Không phải “bỏ Supabase”. Supabase vẫn là **nền tảng học + auth** của LingoPro.

---

## 2. “Message” là gì?

**1 message Realtime** ≈ 1 gói tin đi qua kênh Supabase Realtime (broadcast / presence update / postgres_changes, tùy cách dùng).

### Cách naive (dễ vỡ limit)

Mỗi client **tự broadcast** vị trí:

```text
Mỗi 50ms (20Hz):  client → server: { id, x, y, facing }
Server fan-out → mọi client khác trong phòng
```

### Đếm thô (worst-case fan-out)

Giả sử **mọi** update của 1 người được **gửi tới từng** người còn lại (broadcast full mesh kiểu “mỗi gói là 1 message inbound + N outbound” — cách đếm thực tế phụ thuộc triển khai; dưới đây là **ước lượng order of magnitude** để thấy vì sao tần suất cao nguy hiểm):

| Ký hiệu | Ý nghĩa | Ví dụ |
|---------|---------|--------|
| `P` | Số player trong 1 map/room | 30 |
| `Hz` | Lần gửi vị trí / giây / player | 20 |
| Inbound | Client → server | `P × Hz` = 30 × 20 = **600/s** |

Nếu **mỗi** inbound được fan-out thành **(P−1)** gói ra client khác:

```text
Outbound ≈ 600 × 29 ≈ 17 400 “deliveries”/s
```

Dù Supabase đếm “messages” theo cách gộp (1 broadcast = 1 msg server-side, không phải 29), **inbound 600/s đã vượt**:

- Free **100 msg/s**
- Pro **500 msg/s**

→ **600 inbound/s > 500 Pro** chỉ với việc 30 người spam position 20Hz, **chưa** kể chat, presence, DB changes.

**Kết luận số học:** Không cần fan-out 17k — **chỉ inbound position đã đủ “dễ vượt” Pro 500/s**. Số 17 400 trong research trước là **minh họa fan-out full mesh** (worst case / naive socket server), không phải con số official billing của Supabase. Quan trọng là **order of magnitude + tần suất**.

### Bảng so nhanh

| Tình huống | Inbound msg/s (ước) | Free 100 | Pro 500 |
|------------|---------------------|----------|---------|
| 5 người × 5 Hz | 25 | OK | OK |
| 10 người × 10 Hz | 100 | Chạm Free | OK |
| 20 người × 10 Hz | 200 | Vượt Free | OK |
| 30 người × 20 Hz | **600** | Vượt | **Vượt Pro** |
| 30 người × 2 Hz (thưa) | 60 | OK | OK |
| 1 check-in / người / ngày | ~0 | OK | OK |

→ Muốn đông + mượt: **hạ Hz**, **gộp room nhỏ**, hoặc **engine game** (Colyseus).

---

## 3. Supabase Realtime dùng **đúng** việc gì?

Supabase Realtime **giỏi**:

- Postgres Changes (INSERT XP, update streak)  
- Presence “ai online” (update thưa, vài giây/lần)  
- Broadcast thỉnh thoảng (chat, “ai đó hoàn thành quest”)  
- Signal matchmaking (“tìm pair”)

**Không tối ưu** (dù làm được ở quy mô nhỏ):

- Sync physics/position 15–20Hz cho 20–40 avatar  
- Authoritative anti-cheat movement  

**Pricing phụ:** ngoài msg/s còn **messages/month** + concurrent connections (Free 200 conn, Pro 500…). Position spam còn **đốt quota tháng**.

---

## 4. Colyseus làm gì khác?

Colyseus = **Node game server** chuyên room multiplayer:

1. Client join `Room` (vd `TownRoom`, `Classroom_abc`).  
2. Server giữ **state** schema: map player → `{x,y,facing,anim}`.  
3. Client gửi **input** (hoặc position có validate).  
4. Server tick / patch: chỉ **delta** (field đổi) → client khác **lerp** (nội suy).  
5. Patch rate mặc định ~**50ms (20Hz)** — đủ mượt với interpolation (docs Phaser tutorial).

### Ưu điểm cho move

| | Supabase broadcast raw | Colyseus |
|--|------------------------|----------|
| Payload | JSON tùy ý, dễ phình | Schema binary/delta |
| Authority | Client-heavy | Server room |
| Room | Channel thủ công | Matchmake / maxClients |
| Tối ưu | Tự viết throttle, AOI | State View, patch rate |
| Host | Có sẵn project | Cần process Node (Fly/DO/Railway…) |

**Không thay** Supabase database — chỉ **tách kênh move**.

---

## 5. Kiến trúc LingoPro đề xuất (rõ vai)

```text
┌────────────── Client (Next + Phaser) ──────────────┐
│  WASD → local prediction                           │
│  → gửi input/state tới Colyseus                    │
│  ← nhận patch → vẽ avatar người khác (lerp)        │
│                                                    │
│  E zone → React panel ôn                           │
│  ôn xong → POST /api/... (Supabase JWT)            │
│  check-in / XP / rank → Postgres                   │
└────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
  Colyseus (move only)          Supabase (học + auth)
  - room classroom              - users, srs, packs
  - x,y,facing                  - quiz_results, XP ledger
  - max 20–40 / room            - Realtime: optional
                                  presence thưa / chat
```

### Room strategy (giảm tải)

- **Không** 1 global map 1000 người.  
- `classroom:{id}` max **20–30** HS.  
- Lobby public max **15–20**.  
- Area of interest sau này: chỉ sync người gần (nếu map lớn).

### Throttle nếu vẫn muốn thử Supabase-only (MVP cực nhỏ)

| Setting | Gợi ý |
|---------|--------|
| Position Hz | 2–5 (không 20) |
| Chỉ gửi khi **đổi ô / đổi facing** | Rẻ hơn |
| Presence heartbeat | 5–15s/lần |
| Số người / channel | ≤ 10–15 |

→ “Thấy bóng người” được; **không** mượt như Stardew co-op.

---

## 6. Tính ví dụ chi phí cảm nhận (order of magnitude)

**Chỉ position 20Hz × 30 người, 1 giờ peak/ngày, 30 ngày:**

```text
600 msg/s × 3600 s ≈ 2.16M msg / giờ peak
× 30 ngày ≈ 65M msg/tháng  (nếu peak 1h/ngày)
```

So với Pro ~**5M messages/month** included → **vượt xa** nếu spam cả ngày; ngay cả peak ngắn cũng dễ căng msg/s.

**Colyseus:** trả **VM** (vài $–chục $/tháng), bandwidth binary patch, không dính Realtime msg/s của Supabase.

**Data học:** 1 HS ôn 100 thẻ/ngày = vài trăm write DB — **nhỏ** so với position stream.

---

## 7. Roadmap thực tế LingoTown

| Phase | Multiplayer | Ghi chú |
|-------|-------------|---------|
| **A** | Single + NPC bot | Demo hiện tại, 0 msg Realtime |
| **B** | Supabase Presence “online” + avatar đứng yên / 2Hz | Rẻ, đủ social nhẹ |
| **C** | Colyseus move trong classroom room | Mượt, 20–30 HS |
| **D** | Pair match + voice optional | Event trên Supabase + room Colyseus |

**Đừng** nhảy A → full 20Hz trên Supabase Broadcast.

---

## 8. Tóm 5 câu

1. **20Hz** = mỗi giây gửi vị trí **20 lần**/người.  
2. **30 người** → ~**600 gói/s vào server** nếu ai cũng spam.  
3. Supabase Pro limit **~500 msg/s** → dễ **vượt / giật / tốn tiền**.  
4. **Colyseus** = server game, delta state, đúng bài “nhiều người đi trên map”.  
5. **Supabase** = auth + từ vựng + XP + rank — **data học**, không phải physics loop.

---

## 9. Nguồn

- https://supabase.com/docs/guides/realtime/limits  
- https://docs.colyseus.io/learn/tutorial/phaser  
- https://docs.colyseus.io/ (state, patch rate)  
- Notebook `8fb54758-61fd-4108-bfab-975a1480eed4` (research LingoTown tilemap)

*File này giải thích chi tiết câu multiplayer trong `bao-cao-lingotown-tilemap-that-2026-07-17.md`.*
