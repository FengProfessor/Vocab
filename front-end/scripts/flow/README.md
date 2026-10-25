# Google Flow Automated Image Pipeline (Headless CLI)

Quy trình tự động hóa 100% bằng **dòng lệnh (CLI)** để sinh ảnh minh họa từ vựng chất lượng cao chuẩn Pixar/Disney 3D từ **Google Flow** (`flow.google.com`) và nạp trực tiếp vào Supabase Storage & cơ sở dữ liệu `global_dictionary`.

---

## 1. Kiến trúc luồng hoạt động

```
[vocab-stages-v1.json] (Lộ trình 3,000 từ)
         │
         ▼  (1) Tạo prompt sư phạm 4 tầng (Pixar 3D, Micro-Story, Visual Anchor, Negative Constraints)
[generate-roadmap-flow.ts]
         │
         ▼
[tmp/flow/stageX/<topic>/manifest.json]
         │
         ▼  (2) CLI Headless Playwright (Tự động đăng nhập qua Chrome Profile đã lưu)
[run-flow-headless.py] ────────► Google Flow Agentic UI (flow.google.com)
         │                               │
         │  ◄── Tải trực tiếp PNG gốc ───┘
         ▼
[tmp/flow/stageX/<topic>/output/<slug>.png]
         │
         ▼  (3) Upload Supabase Storage + Cập nhật global_dictionary + vocab-stages-v1.json
[ingest-flow-batch.ts]
```

---

## 2. Các lệnh CLI sử dụng

### Bước 1: Tạo Prompt cho chủ đề hoặc Stage
Sử dụng Gemini (`gemini-2.5-flash`) kèm fallback Groq để tạo prompt 4 lớp:
```powershell
# Tạo prompt cho 1 chủ đề cụ thể (VD: Gia đình & Bản thân - 75 từ)
npm run flow:prompts -- --stage 1 --topic s1-topic-family

# Hoặc tạo prompt cho toàn bộ 12 chủ đề của Stage 1 (900 từ)
npm run flow:prompts -- --stage 1
```

### Bước 2: Chạy sinh ảnh tự động từ Google Flow (CLI Headless)
Chạy hoàn toàn trong nền terminal, không cần mở giao diện trình duyệt:
```powershell
# Chạy sinh toàn bộ ảnh cho chủ đề (tự động bỏ qua ảnh đã có)
python -u scripts/flow/run-flow-headless.py --manifest tmp/flow/stage1/s1-topic-family/manifest.json --out-dir tmp/flow/stage1/s1-topic-family/output/

# Chạy thử nghiệm N từ đầu tiên (ví dụ 5 từ)
python -u scripts/flow/run-flow-headless.py --manifest tmp/flow/stage1/s1-topic-family/manifest.json --out-dir tmp/flow/stage1/s1-topic-family/output/ --limit 5

# Nếu muốn xem trực tiếp trình duyệt thao tác (Headful mode)
python -u scripts/flow/run-flow-headless.py --manifest tmp/flow/stage1/s1-topic-family/manifest.json --out-dir tmp/flow/stage1/s1-topic-family/output/ --headful
```

### Bước 3: Đồng bộ ảnh lên Supabase & Roadmap
Tự động tải lên Supabase Storage bucket `vocab-images/flow/roadmap/`, cập nhật `global_dictionary` và gắn `imageUrl` vào file roadmap `src/data/roadmap/vocab-stages-v1.json`:
```powershell
npm run flow:ingest -- --dir tmp/flow/stage1/s1-topic-family
```

---

## 3. Các tính năng tối ưu

- **Khôi phục phiên làm việc (Resume Capability)**: Mỗi chủ đề sẽ tự động lưu lại `project_url.txt`. Khi chạy lại, script sẽ tự động mở lại đúng dự án đang dở mà không cần tạo dự án mới.
- **Bỏ qua ảnh đã tạo (`--skip-existing`)**: Mặc định bật, script sẽ kiểm tra file ảnh `output/<slug>.png`. Nếu đã tồn tại (> 10KB), script sẽ bỏ qua ngay lập tức trong 0s.
- **Phòng chống Rate Limit (`--jitter-min`, `--jitter-max`)**: Tự động nghỉ ngẫu nhiên từ 4-7 giây giữa mỗi lần sinh ảnh để giữ tài khoản an toàn tuyệt đối.
- **Độ phân giải cao & Không chữ**: Bộ prompt negative constraints loại bỏ triệt để văn bản, chữ cái, nhãn mác, watermark, chỉ giữ lại phong cách Pixar/Disney ấm áp và biểu cảm nhân vật rõ nét.
