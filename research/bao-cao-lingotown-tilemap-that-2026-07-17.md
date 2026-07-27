# Research: LingoTown “vẽ + tương tác thật” (không ảnh nền)

**Ngày:** 2026-07-17  
**Mục tiêu:** Cách làm hub pixel **interactive thật** (tilemap, collision, zone, multiplayer) — khác hẳn demo hiện tại (JPG + hotspot chuẩn hóa).  
**Nguồn:** NotebookLM deep research (88 sources) + import/query + web (Phaser/Tiled/Colyseus/Supabase/Pablo.gg/Ourcade).

| | |
|--|--|
| **NotebookLM** | `LingoTown real tilemap interactive game` |
| **Notebook ID** | `8fb54758-61fd-4108-bfab-975a1480eed4` |
| **Research task** | `16ab9de5-e3b2-441f-a7f6-a24c6a1687dd` (88 sources found) |

---

## 1. Vấn đề demo hiện tại (sai kiến trúc “game”)

| Demo LingoTown v2 | Game thật |
|-------------------|-----------|
| 1 ảnh `map.jpg` full scene | **Tileset PNG** + **map JSON** (Tiled) |
| Hotspot `nx,ny` 0–1 “đoán” trên ảnh | **Object layer** đặt zone/NPC chính xác pixel |
| Walk + chặn nước “cứng” tay | **Tile property `collides`** + Arcade Physics |
| Sprite crop từ sheet AI (chroma) | **Anims** 4 hướng, frame walk thật |
| “Hàng chục người” = bot local | **Realtime room** (presence / Colyseus) |
| Panel ôn React | Đúng — UI học vẫn React (không vẽ trong canvas) |

**Kết luận:** Ảnh AI chỉ dùng làm **moodboard / concept art**. Production phải **vẽ bằng tile** và **tương tác bằng data map**.

---

## 2. Stack khuyến nghị cho LingoPro (Next.js + Supabase)

```text
┌─────────────────────────────────────────────────────┐
│ Next.js (App Router)                                │
│  React HUD / panel ôn / pair / quest / chat         │
│  EventBus ←→ Phaser Scene                           │
│  ┌───────────────────────────────────────────────┐  │
│  │ Phaser 3 (dynamic import, ssr:false)           │  │
│  │  Tilemap · Player · NPC · Camera · Colliders   │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
         │ auth, XP, packs, SRS          │ movement state
         ▼                               ▼
   Supabase (đã có)              Colyseus room (sau)
   Auth · leaderboard ·          x,y,facing,anim
   check-in · classroom          (không spam Supabase Realtime)
```

### Vì sao không “chỉ canvas React” như demo?

- Scale map, depth roof/tree, collision faces, camera follow: Phaser/Tiled **đã giải** hàng năm.  
- React giỏi **UI học** (panel ôn, quest) — giữ như hiện tại.  
- Bridge: **EventBus** / `CustomEvent` (pattern Pablo.gg + Phaser official templates).

### Multiplayer: Colyseus vs Supabase Realtime

| | **Colyseus** | **Supabase Presence/Broadcast** |
|--|--------------|----------------------------------|
| Di chuyển 20–30 player 20Hz | Phù hợp (delta schema, room) | **Dễ vượt msg/s** (Pro ~500 msg/s) |
| Authority | Server authoritative | Client broadcast |
| LingoPro fit | Room `classroom:{id}` / lobby | Check-in, online list **thưa**, chat chậm |
| Chi phí | VM nhỏ / self-host | Dùng DB đã có; **đừng** broadcast position mỗi frame |

**Verdict (NLM + sources):**  
- **Movement multiplayer → Colyseus** (hoặc server WS tương đương).  
- **Supabase → auth, XP, packs, leaderboard, check-in** (đã có stack LingoPro).  
- Phase đầu: **single-player + NPC bot** vẫn OK (như demo), multiplayer sau.

---

## 3. Pipeline “vẽ thật” với Tiled

### 3.1 Công cụ

1. **Tiled** (mapeditor.org) — FOSS, export JSON cho Phaser.  
2. **Tileset** CC0 / OGA (Kenney, Zelda-like ArMM1998, LPC…) — **không** dùng 1 JPG full map.  
3. Optional: **grid-engine** plugin — đi theo ô (RPG Maker vibe).

### 3.2 Luật export (bắt buộc, hay fail silent)

1. Tile layer format: **CSV** hoặc **Base64 uncompressed** (không gzip/zlib).  
2. **Embed tileset** vào map.  
3. Export **JSON** (`File → Export As → JSON`).  
4. Mỗi lần sửa `.tmx` → **export lại JSON** (save TMX không đủ).  
5. `addTilesetImage(nameTrongTiled, keyPhaser)` — **2 string phải khớp** nếu không = màn đen không error.

### 3.3 Layer đề xuất LingoTown

| Layer (Tiled) | Vai trò |
|---------------|---------|
| `ground` | Cỏ, path, plaza |
| `water` / `obstacles` | Va chạm (`collides: true` trên tile) |
| `decor` | Hoa, lamp (có thể không collide) |
| `above` | Mái, tán cây — `depth` > player |
| Object: `spawns` | `spawnPoint`, `npc_*` |
| Object: `zones` | `zone=fountain\|grove\|library…` + `activityId` |
| Object: `teleports` | `teleportTo=mapKey:x:y` (town ↔ library) |

### 3.4 Collision

Trong **Tileset Editor** (không phải layer props):

- Property bool `collides = true` trên từng tile tường/nước/cây.  
- Phaser:

```ts
worldLayer.setCollisionByProperty({ collides: true });
this.physics.add.collider(player, worldLayer);
```

Arcade tự tính “interesting faces” → bớt kẹt góc khi đi chéo.

### 3.5 Tương tác (E / click zone)

Pattern production (Pablo.gg + NLM):

1. **Invisible collider** trước mặt player (theo facing).  
2. `physics.add.overlap(actionCollider, interactables, …)`.  
3. Chỉ khi `JustDown(E)` mới fire (tránh spam).  
4. Emit EventBus → React mở **panel ôn** (đã có `MiniStudySession`).

Object Tiled ví dụ:

```text
name: zone_fountain
type: zone
properties:
  zoneId: fountain
  activityId: act-review
  label: Đài điểm danh
```

→ Không còn “đo tọa độ 0–1 trên JPG”.

---

## 4. Sprite & animation thật

1. Spritesheet / atlas 4 hướng (hoặc 3 + flipX cho trái).  
2. `this.anims.create({ key: 'walk-down', frames: …, frameRate: 8, repeat: -1 })`.  
3. Di chuyển: normalize vector (tránh tốc độ chéo ×√2).  
4. Optional **grid-engine**: `ge_collide` trên tile, move theo ô — giống Avatar/RPG Maker.

---

## 5. Next.js integration (tránh crash SSR)

```tsx
// app/demo/lingo-town-v3/page.tsx
import dynamic from 'next/dynamic';

const PhaserTown = dynamic(() => import('@/game/PhaserTown'), {
  ssr: false,
  loading: () => <div>Loading town…</div>,
});
```

- `destroy()` Phaser game khi unmount (tránh leak multi instance).  
- UI học: React absolute overlay (panel ôn, pair, HUD) — **đúng hướng** đã làm panel gọn.  
- Phaser chỉ lo **world + avatar + collide + zone events**.

EventBus (rút gọn):

```ts
// game/EventBus.ts
import { Events } from 'phaser';
export const EventBus = new Events.EventEmitter();

// Phaser: EventBus.emit('zone:enter', { zoneId, activityId })
// React:  EventBus.on('zone:enter', openStudyPanel)
// React:  EventBus.emit('player:teleport', { x, y })
```

---

## 6. MVP build order (khuyến nghị LingoPro)

| Phase | Việc | Done khi |
|-------|------|----------|
| **0** | Concept art AI chỉ để design | — |
| **1** | `phaser` + `dynamic ssr:false` + EventBus | Canvas chạy trong `/demo/lingo-town-v3` |
| **2** | Tiled map 1 màn (town) + tileset free + export JSON | Thấy tile ground/path, không JPG full |
| **3** | Player spawn + walk anim + collide walls | Không xuyên tường/nước |
| **4** | Object zones → EventBus → **MiniStudySession** (đã có) | E mở panel ôn gọn |
| **5** | Map 2: library interior + teleport | Town ↔ Library |
| **6** | NPC + dialogue props từ Tiled | E nói chuyện |
| **7** | Bot “ghost” players (local fake) | Cảm giác đông |
| **8** | Colyseus room classroom (optional) | Thấy người thật |
| **9** | Gắn XP/check-in Supabase thật | Production loop |

**Không** làm phase 8 trước phase 4.

---

## 7. So với “ảnh + hotspot” — checklist migrate

| Bỏ | Thay bằng |
|----|-----------|
| `public/lingo-town/map.jpg` làm world | `town.tmj` + `tileset.png` |
| `zoneAtNorm(nx,ny)` | `map.getObjectLayer('zones')` + overlap |
| `blocked[][]` hardcode | `setCollisionByProperty` |
| Chroma key hero JPG | Spritesheet + anims |
| Bot seats random | Object seats / spawn points trong Tiled |

**Giữ:**

- `MiniStudySession` / panel ôn gọn  
- `lingo-town-activities` catalog  
- Supabase auth, packs, SRS APIs  
- HUD React (XP, streak)

---

## 8. Asset & chi phí (tiết kiệm)

| Nguồn | Ghi chú |
|-------|---------|
| [Tiled](https://www.mapeditor.org/) | Free |
| Kenney / OpenGameArt / itch CC0 | Free tilesets |
| [grid-engine](https://annoraaq.github.io/grid-engine/) | MIT-ish plugin |
| [Phaser](https://phaser.io/) | Free (MIT) |
| Colyseus | Open source; cloud optional |
| AI image | Chỉ moodboard, **không** làm collision map |

---

## 9. Nguồn chính đã dùng

- NotebookLM query (notebook `8fb54758-…`) — tổng hợp 100+ refs  
- [Ourcade: Loading Tiled in Phaser 3](https://blog.ourcade.co/posts/2020/phaser-3-noob-guide-loading-tiled-tilemaps/)  
- [Pablo.gg: Phaser + React top-down RPG](https://pablo.gg/en/blog/coding/how-to-create-a-top-down-rpg-maker-like-game-with-phaser-js-and-react/)  
- [Colyseus Phaser tutorial](https://docs.colyseus.io/learn/tutorial/phaser)  
- [Supabase Realtime multiplayer features](https://supabase.com/blog/supabase-realtime-with-multiplayer-features)  
- Michael Hadley Modular Tilemaps series (Phaser 3)  
- Phaser official React/Next templates  

---

## 10. Next action (code)

1. `npm i phaser` (+ optional `grid-engine`)  
2. Scaffold `src/game/` : `EventBus.ts`, `scenes/TownScene.ts`, `PhaserTown.tsx`  
3. Tạo map Tiled nhỏ (32×32 tiles) + 1 tileset free  
4. Wire zone → panel ôn hiện có  
5. **Không** thay demo JPG cho đến khi TownScene walk+collide ổn  

---

*Research lưu cho phase implement “LingoTown v3 real tilemap”.*
