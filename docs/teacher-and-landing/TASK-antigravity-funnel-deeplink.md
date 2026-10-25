# TASK (Antigravity) — Deep-link pack cho funnel TikTok

> **Vai trò:** Antigravity làm phần chuyên môn web-app (DB/catalog/UI). Phần chiến lược + video do Claude lo. File này là spec đủ để thực thi, KHÔNG cần hỏi thêm về chiến lược.
> **Phạm vi repo:** CHỈ `web-app/`. KHÔNG đụng `vocab-tiktok-factory/` (Claude quản).

## Bối cảnh (1 đoạn)
Kênh TikTok đăng video "Bộ sưu tập" (mega-list FOMO): *"200 Collocations TOEIC — full bộ trong app LingoPro, link bio"*. Người xem bấm link bio → phải **đáp THẲNG vào đúng pack đó**. Hiện funnel rò: `/library` không có deep-link, và 3 pack đặc biệt bị gộp vào route `di-lam`/`hoc-thuat` nên viewer phải tự mò.

## CONTRACT (BẮT BUỘC — video sẽ trỏ đúng vào đây, không được đổi)
Mở 3 URL này phải đáp đúng pack tương ứng, hiển thị đủ từ + nút thêm-vào-từ-của-tôi:

| URL | Pack | Số từ |
|-----|------|------|
| `https://lingopro.online/library?pack=toeic-collocations` | 200 Collocations TOEIC | 200 |
| `https://lingopro.online/library?pack=phrasal-daily` | 150 Phrasal Verbs Đời Sống | 150 |
| `https://lingopro.online/library?pack=idioms-natural` | 100 Idioms Tự Nhiên | 100 |
| `https://lingopro.online/library?pack=make-do-collocations` | 150 Collocations Make/Do/Take/Have | 150 |
| `https://lingopro.online/library?pack=nawl-academic` | 963 Từ Học Thuật NAWL | 963 |
| `https://lingopro.online/library?pack=ielts-task1` | Bộ IELTS Writing Task 1 | ~120 |

- **slug ổn định** = đúng 3 chuỗi: `toeic-collocations`, `phrasal-daily`, `idioms-natural` (khớp id collection bên video). Đây là khóa public, đừng đổi.
- Mở URL (kể cả chưa login) → `/library` **auto-chọn + scroll tới** đúng pack, mở preview/CTA. Chưa login thì xem preview được, bấm "thêm" mới yêu cầu login.

## Việc cần làm
1. **Gán slug riêng cho 3 pack** = đúng 3 chuỗi trên (thay vì chỉ map tên VN vào `di-lam`/`hoc-thuat`). Có thể vẫn để chúng thuộc route cha, nhưng pack PHẢI addressable bằng slug riêng. Sửa `scripts/catalog-v3/routes.ts` + bước generate để catalog emit field `slug`/`packId` = slug đó.
2. **Deep-link `/library?pack=<slug>`**: trong `src/app/library/page.tsx` đọc `useSearchParams().get('pack')` → nếu khớp slug thì set `previewPack` + auto-mở + scroll. Không khớp → hành vi cũ.
3. **Nổi bật 3 pack**: gom thành 1 nhóm có tên dễ nhận (vd "🔥 Bộ HOT / Tải nhanh") trên `/library` để viewer nhận ra "200 Collocations TOEIC" ngay, không chìm trong subtopic.

## Acceptance (phải pass hết)
- [ ] 3 URL ở Contract mở đúng pack, đủ 200/150/100 từ, scroll/preselect đúng.
- [ ] slug = đúng 3 chuỗi (grep được trong catalog generated).
- [ ] `npx tsx scripts/catalog-v3/generate.ts` chạy sạch.
- [ ] `npx tsx scripts/catalog-v3/quality-gate.ts` → vẫn **182/182 published, 0 quarantine** (không tụt).
- [ ] Không vỡ route/pack khác; build `npm run build` pass.

## Validation (chạy + dán output khi xong)
```bash
cd web-app
npx tsx scripts/catalog-v3/generate.ts
npx tsx scripts/catalog-v3/quality-gate.ts
grep -oE "toeic-collocations|phrasal-daily|idioms-natural" src/data/vocab/catalog-v3*.json | sort | uniq -c
```

## Hand-back cho Claude
Báo lại: 3 URL final (nếu khác Contract) + slug thực tế + ảnh chụp `/library?pack=toeic-collocations`. Claude sẽ wire `ctaUrl` + caption video trỏ vào.

## NEVER
- KHÔNG sửa `vocab-tiktok-factory/`.
- KHÔNG đổi 3 slug ở Contract.
- KHÔNG tắt/giảm quality-gate để pass.
