# NHIỆM VỤ: Gán POS role cho annotations ví dụ ngữ pháp

Bạn đang điền nhãn từ loại (part-of-speech) để app tô màu từng từ trong câu ví dụ.

## Quy tắc TUYỆT ĐỐI (vi phạm = hỏng dữ liệu)

1. **CHỈ sửa field `role`.** TUYỆT ĐỐI không đổi `word`, `start`, `end`, hay bất kỳ field nào khác. Offset đã tính sẵn chính xác — đụng vào là lệch màu.
2. **Không thêm/xóa phần tử** trong mảng `annotations`, không đổi thứ tự, không sửa `en`/`vi`/`note`/`exercises`/`sections` khác.
3. Mỗi `role` hiện là `""` (rỗng) → thay bằng đúng 1 giá trị trong whitelist dưới. Không để rỗng.
4. Giữ nguyên cấu trúc JSON hợp lệ (2-space indent, UTF-8). Không thêm comment.

## Whitelist role (dùng ĐÚNG các giá trị này, không có giá trị nào khác)

| role | dùng cho | ví dụ |
|------|----------|-------|
| `noun` | danh từ | book, happiness, John, TV, weekdays |
| `pronoun` | đại từ | he, she, it, they, this, who, which |
| `verb` | động từ chính | run, eat, became, teaches, watch |
| `auxiliary` | trợ động từ (be/have/do làm trợ) | is, am, are, has, have, did, don't, doesn't, does |
| `modal` | động từ khuyết thiếu | can, could, will, would, must, should, may, might |
| `adjective` | tính từ | big, blue, careful, generous |
| `adverb` | trạng từ | quickly, very, often, here, then, usually, not |
| `preposition` | giới từ | in, on, at, by, for, with, to (khi là giới từ) |
| `conjunction` | liên từ | and, but, or, because, although, when |
| `determiner` | hạn định từ | this/that/these/those, my/your, some, any, much, many |
| `article` | mạo từ | a, an, the |
| `interjection` | thán từ | oh, wow, ah |
| `other` | token không rõ / số / ký hiệu | 100°C, 7, $5 |

## Hướng dẫn gán

- Gán theo **từ loại (POS)**, KHÔNG theo chức năng cú pháp. (Đừng dùng "subject"/"object".)
- Câu hỏi: trợ động từ đầu câu (Do/Does/Did/Is/Are) → `auxiliary`.
- Phrasal verb ("look up", "get up"): động từ chính → `verb`, tiểu từ đi kèm → `adverb`.
- Contraction đã gộp 1 token: `don't`/`doesn't`/`isn't` → `auxiliary`; `can't`/`won't` → `modal`; `'s` (is) → `auxiliary`.
- Gerund/infinitive làm danh từ vẫn gán `verb` (đó là POS gốc).
- `to` trong "to + V nguyên thể" → `preposition`. `to` chỉ hướng ("to work") → `preposition`.
- Sở hữu cách "father's" (1 token) → `noun`.
- "not"/"n't" tách riêng → `adverb`.
- Token là số/ký hiệu ("100°C", "7 a.m.") → `other` (hoặc `noun` nếu rõ là danh từ như "Monday").

## Cách làm
Mở từng file JSON được giao. Trong `sections.examples[]`, mỗi phần tử có `annotations[]`. Điền `role` cho mọi token. Lưu lại. Làm hết các file được giao.
