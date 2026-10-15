<p align="center">
  <img src="docs/assets/repository-hero.svg" alt="LingoPro — lưu từ vựng, ôn tập với FSRS và thực hành tiếng Anh" width="100%" />
</p>

<p align="center">
  <strong>Học tiếng Anh từ những từ bạn muốn ghi nhớ.</strong><br />
  Lưu từ vựng, ôn tập ngắt quãng, học ngữ pháp và luyện thi dành cho người Việt.
</p>

<p align="center">
  <a href="https://lingopro.online"><strong>Khám phá LingoPro ↗</strong></a> ·
  <a href="#tính-năng">Tính năng</a> ·
  <a href="docs/development.md">Chạy cục bộ</a> ·
  <a href="docs/README.md">Tài liệu</a> ·
  <a href="README.md">English</a>
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16-111827?style=flat-square&amp;logo=nextdotjs&amp;logoColor=white" alt="Next.js 16" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&amp;logo=typescript&amp;logoColor=white" alt="TypeScript 5" /></a>
  <a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase-PostgreSQL-16855B?style=flat-square&amp;logo=supabase&amp;logoColor=white" alt="Supabase PostgreSQL" /></a>
  <a href="https://github.com/FengProfessor/Vocab/actions/workflows/deploy-server.yml"><img src="https://github.com/FengProfessor/Vocab/actions/workflows/deploy-server.yml/badge.svg?branch=main" alt="Workflow phát hành production trên nhánh main" /></a>
</p>

## Vì sao chọn LingoPro

Tra nghĩa chỉ là bước khởi đầu. LingoPro kết nối việc khám phá từ mới với bộ sưu tập từ vựng cá nhân, lên lịch ôn tập bằng FSRS và đưa những từ đã học vào bài thực hành. Phần giải thích bằng tiếng Việt giúp người học đi từ hiểu nghĩa đến sử dụng từ.

## Tính năng

| Nội dung | Trải nghiệm |
| --- | --- |
| **Từ vựng** | Tra nghĩa, phiên âm IPA và ví dụ; lưu từ vào bộ sưu tập cá nhân. |
| **Ôn tập ngắt quãng** | Ôn các từ đã lưu theo lịch FSRS, sử dụng thư viện `ts-fsrs`. |
| **Ngữ pháp** | Học theo lộ trình nền tảng và luyện tập qua các bài học tương tác ngắn. |
| **Kỹ năng ngôn ngữ** | Luyện nghe, đọc, nói và viết trong từng khu vực học tập riêng. |
| **Luyện thi** | Truy cập các khu vực luyện thi TOEIC, VSTEP và VNU Bậc 3. |
| **Thói quen học tập** | Theo dõi tiến độ, chuỗi ngày học và điểm XP. |

### Xem trước sản phẩm

<p align="center">
  <a href="https://lingopro.online"><img src="docs/assets/home-preview.webp" alt="Trang chủ công khai của LingoPro với chức năng tra từ và quy trình học tập" width="100%" /></a>
</p>

*Trang chủ công khai. Các khu vực học tập có lưu tiến độ cá nhân yêu cầu tài khoản.*

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Ứng dụng web | Next.js 16 App Router, React 19, TypeScript 5 |
| Giao diện | Tailwind CSS 4, các thành phần giao diện nền tảng, biểu tượng Lucide |
| Dữ liệu và xác thực | Supabase PostgreSQL, Auth và bảo mật cấp hàng (RLS); xử lý phiên ở phía máy chủ |
| Bộ máy ôn tập | `ts-fsrs` |
| Tích hợp AI | Google Gemini với cơ chế luân chuyển khóa; các nhà cung cấp khác qua bộ định tuyến AI |
| Nhắc học | Firebase Cloud Messaging |
| Nền tảng ứng dụng | Tích hợp PWA; bản đóng gói Android và iOS bằng Capacitor |
| Production | Next.js standalone trên Ubuntu/systemd; quy trình phát hành qua GitHub Actions |

## Chạy cục bộ

Sử dụng **Node.js 22** và npm, đồng nhất với CI. Cấu hình backend riêng cho môi trường phát triển theo [hướng dẫn chạy cục bộ](docs/development.md) trước khi kiểm tra các luồng tài khoản hoặc dữ liệu.

```bash
git clone https://github.com/FengProfessor/Vocab.git
cd Vocab
npm ci
# Cấu hình .env.local theo docs/development.md, sau đó:
npm run dev
```

Mở [localhost:3000](http://localhost:3000). Các tính năng backend, AI và thông báo phụ thuộc vào cấu hình tương ứng; hướng dẫn thiết lập nêu rõ từng yêu cầu.

## Cấu trúc dự án

```text
src/app/         Trang, bố cục và API route
src/components/  Thành phần giao diện dùng chung
src/lib/         Bộ máy ôn tập, xác thực, dữ liệu và tích hợp dịch vụ
src/data/        Nội dung học tập và dữ liệu luyện thi
supabase/        Migration cơ sở dữ liệu và SQL hỗ trợ
tests/           Các bộ kiểm thử tính năng, bảo mật, tích hợp và trình duyệt
docs/            Hướng dẫn phát triển, kiến trúc và vận hành
.github/         Workflow, biểu mẫu issue và mẫu pull request
```

## Kiểm tra chất lượng và phát hành

```bash
npm run lint
npm run typecheck
npm run build
npm run test:e2e:smoke
```

Mỗi bước kiểm tra có phạm vi riêng. Bộ smoke test trên trình duyệt kiểm tra các luồng chưa đăng nhập; kết quả này chưa chứng minh khả năng lưu tiến độ của người dùng đã đăng nhập. Repository cũng ghi nhận các lỗi lint và typecheck tồn đọng. Đọc [phân loại kiểm thử và lỗi nền đã ghi nhận](docs/testing/test-classification.md) trước khi diễn giải kết quả.

Phát hành production đi qua workflow GitHub Actions chuẩn: kiểm tra chất lượng → migration → build đúng commit → kích hoạt bản phát hành → khởi động lại → kiểm tra tình trạng dịch vụ. Mọi thao tác production cần người vận hành cho phép rõ ràng; xem [hướng dẫn triển khai](docs/operations/production-deploy.md).

## Tài liệu và đóng góp

- [Mục lục tài liệu](docs/README.md) — tìm hướng dẫn phát triển, kiến trúc và vận hành.
- [Hướng dẫn đóng góp](CONTRIBUTING.md) — xác định phạm vi thay đổi, kiểm tra và mở pull request.
- [Báo lỗi](https://github.com/FengProfessor/Vocab/issues/new?template=bug_report.yml) — cung cấp ví dụ có thể tái hiện lỗi.
- [Đề xuất cải tiến](https://github.com/FengProfessor/Vocab/issues/new?template=feature_request.yml) — mô tả vấn đề người học gặp phải và kết quả mong muốn.

Repository hiện chưa có tệp `LICENSE`. Hãy trao đổi với người duy trì trước khi sử dụng lại mã nguồn hoặc tài liệu học tập đi kèm.
