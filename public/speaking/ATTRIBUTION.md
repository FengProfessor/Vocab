# Nguồn tranh cho lộ trình Speaking 32 bài

- Tranh trong `public/speaking/openmoji/`: [OpenMoji](https://openmoji.org/), bản màu SVG lấy nguyên từ [repository chính thức](https://github.com/hfg-gmuend/openmoji) (`color/svg/<HEX>.svg`), giấy phép [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Không chỉnh sửa SVG.
- Ánh xạ bài học → tranh nằm ở `src/data/speaking/curriculum/visuals.json`. Tải lại bằng `npx tsx scripts/speaking/build-visual-assets.ts` (script báo lỗi nếu có mã không tồn tại).
- IPA trong bài được đối chiếu với [open-dict-data/ipa-dict](https://github.com/open-dict-data/ipa-dict) (MIT) bằng `npx tsx scripts/speaking/verify-ipa.ts`.
