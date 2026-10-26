# Hướng dẫn phát triển `front-end` (Vite SPA)

Tài liệu này quy định cấu trúc thư mục, quy ước đặt tên và kiến trúc gọi API của ứng dụng `front-end/` (React 19 + TypeScript + Vite SPA kết nối với `.NET 10` Web API).

---

## 1. Cấu trúc thư mục theo Feature (`features/` + `shared/`)

Mã nguồn trong `front-end/src/` được tổ chức xoay quanh các phân hệ nghiệp vụ (`features/<domain>/`) và tầng dùng chung (`shared/`):

```text
src/
├── app/                      # Bootstrap SPA (main.tsx, AppProviders.tsx, AppRouter.tsx) và route pages
├── features/                 # 14 phân hệ nghiệp vụ độc lập
│   ├── auth/
│   ├── vocab/
│   ├── grammar/
│   ├── dictionary/
│   ├── reading/
│   ├── listening/
│   ├── speaking/
│   ├── exam/
│   ├── roadmap/
│   ├── classroom/
│   ├── challenge/
│   ├── billing/
│   ├── social/
│   └── admin/
│       ├── api.ts            # Dịch vụ gọi API .NET 10 (/api/v1/*) của phân hệ
│       ├── queries.ts        # React Query hooks (useXxxQuery, useXxxMutation)
│       ├── mappers.ts        # Hàm thuần chuyển đổi DTO server <-> model UI
│       ├── types.ts          # Toàn bộ interface/type của phân hệ
│       ├── lib/              # Thuật toán & hàm tiện ích nghiệp vụ (FSRS, chấm điểm, parser...)
│       ├── __tests__/        # Unit test Vitest của phân hệ
│       └── index.ts          # Public barrel export của phân hệ
├── shared/                   # Tiện ích hạ tầng dùng chung toàn ứng dụng
│   ├── api/                  # Axios apiClient, unwrap ApiResponse<T>, React Query keys
│   ├── ui/                   # Primitive UI wrappers (ThemeProvider, Image, Dynamic)
│   ├── router/               # Điều hướng SPA (useRouter, usePathname, Link...)
│   ├── lib/                  # Tiện ích dùng chung (utils, storage, analytics, redirect, media)
│   ├── hooks/                # Custom React hooks dùng chung
│   └── config/               # Cấu hình môi trường (appConfig, aiCoach)
└── types/
    ├── api/                  # Schema OpenAPI & DTO chuẩn sinh từ Swagger .NET 10 (schema.d.ts, index.ts)
    └── enums.ts              # Tập hợp seluruh Business Enums đồng bộ với .NET 10 Domain
```

---

## 2. Quy ước đặt tên (Naming Conventions)

1. **Module TypeScript thường (`kebab-case.ts`)**:
   - Mọi file hàm tiện ích, thuật toán, dịch vụ, cấu hình viết bằng `kebab-case.ts` (ví dụ: `toeic-scoring.ts`, `vstep-scoring.ts`, `listening-utils.ts`, `internal-redirect.ts`).
   - Ngoại lệ duy nhất là các file chuẩn cố định trong từng feature: `api.ts`, `queries.ts`, `mappers.ts`, `types.ts`, `index.ts`.
2. **React Component (`PascalCase.tsx`)**:
   - Mọi file chứa React component viết bằng `PascalCase.tsx` (ví dụ: `AuthProvider.tsx`, `StudentShell.tsx`, `WordDetailModal.tsx`).
3. **Custom Hook (`useXxx.ts` hoặc `use-xxx.ts`)**:
   - Bắt đầu bằng tiền tố `use`.

---

## 3. Các quy tắc kiến trúc bắt buộc (Strict Rules)

### 3.1. Cấm tách `1 interface = 1 file`
- **KHÔNG** tạo các thư mục `types/` con chứa hàng chục file mà mỗi file chỉ có 1 interface/enum (như kiểu C#).
- Trong TypeScript:
  - Các enum đồng bộ với backend đặt chung tại `src/types/enums.ts`.
  - Schema OpenAPI của `.NET 10` đặt tại `src/types/api/schema.d.ts` (cập nhật qua `npm run gen:api`).
  - Các type/interface thuộc domain nào thì gom vào `src/features/<domain>/types.ts`.
  - Props hoặc state nội bộ của riêng 1 component/hook thì khai báo trực tiếp trong file component/hook đó.

### 3.2. Cấm tạo Static Class cho hàm thuần (No Static Utility Classes)
- **KHÔNG** bọc các hàm thuần (pure functions) vào `class XxxScorer { public static calculate(...) }` hay `class XxxUtils { public static ... }`.
- Hãy export trực tiếp các hàm thuần (`export function calculateToeicScore(...)`, `export function scheduleNext(...)`) để hỗ trợ tree-shaking tốt nhất và dễ kiểm thử.

### 3.3. Bắt buộc gọi API qua `features/<domain>/api.ts` + React Query
- **KHÔNG** gọi `fetch('/api/...')`, `axios.get(...)`, hay truy cập Supabase trực tiếp từ bên trong React component.
- Mọi giao tiếp HTTP phải đi qua:
  1. `src/shared/api/client.ts` (`apiClient` tự động đính kèm Bearer token trong bộ nhớ, cookie `HttpOnly` refresh token và xử lý Offline-First).
  2. `src/features/<domain>/api.ts` và `src/features/<domain>/queries.ts`.

---

## 4. Kiểm chứng chất lượng trước khi Commit

Trước khi tạo commit hoặc mở PR, bắt buộc chạy và đảm bảo pass 100%:

```bash
npm run typecheck    # npx tsc --noEmit (0 lỗi)
npm run lint         # eslint src (0 lỗi)
npm run test:unit    # vitest run (pass toàn bộ unit tests)
npm run build        # vite build thành công
```
