# LingoPro Backend (`.NET 10` Clean Architecture + DDD + CQRS + Hybrid SSR)

Enterprise backend implementation for **LingoPro** in `D:\Vocab\back-end\`, strictly adhering to all specifications in [`agent/architect/SKILL.md`](../agent/architect/SKILL.md).

## Key Architectural Standards Implemented

1. **SOLID Principles & `1 File = 1 Class / Record / Interface / Enum`**
   - Every `.cs` file across `Domain`, `Application`, `Infrastructure`, `WebApi`, and `tests` contains exactly **one** top-level type matching its filename.
   - All XML documentation (`/// <summary>`) and inline comments (`// ...`) are written **100% in English**.
2. **Rich Business Enums (Synchronized with `supabase/migrations`)**
   - 38 strongly-typed business enums under `src/LingoPro.Domain/Enums/` (`CertLevel` (`A0`..`C2`), `UserRole` (`Student`, `Teacher`, `Admin`), `SubscriptionPlanType`, `OrderKind`, `OrderStatus`, `SrsCardState`, `SrsReviewQuality`, `RoadmapTrackType`, etc.).
3. **Standardized `ApiResponse<T>` with HTTP `StatusCode`**
   - Every API response includes `StatusCode` (`200`, `201`, `400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`), `Success`, `Message` (English), `Data`, `ErrorCode`, `Errors`, and `TimestampUtc`.
4. **Phased & Selective Multi-Level Caching (L1 Local `IMemoryCache` + L2 `Redis`)**
   - **Phase 1 (Current Active Default — `Caching:Mode = "None"`)**: Registers `NoOpCacheService` so queries execute directly against PostgreSQL with zero Redis overhead while keeping the full `ICacheService` and `CachingBehavior<TRequest, TResponse>` (`where TRequest : ICacheableQuery`) pipeline wired.
   - **Phase 2 (Plug-and-Play — `Caching:Mode = "Hybrid"`)**: Switching `Caching:Mode` to `"Hybrid"` activates `HybridMultiLevelCacheService` (L1 `IMemoryCache` + L2 `IDistributedCache` Redis) without touching any business or handler code.
   - **Selective Opt-In**: Only shared, read-heavy catalog queries (`SmartLookupQuery`, `GetCanonicalGrammarTopicsQuery`, `GetReadingArticlesQuery`, `GetLandingPageSeoDataQuery`) implement `ICacheableQuery`.
5. **Hybrid Server-Side Rendering (SSR SEO Landing + Server-Side Login $\rightarrow$ React SPA) & Supabase Auth tokens**
   - **SEO Home/Landing (`HomeSeoController` $\rightarrow$ `Views/Home/Index.cshtml`)**: Renders full HTML, OpenGraph, and JSON-LD structured data on the server for `GET /` and `GET /landing`.
   - **Server-Side Login (`AuthSsrController` $\rightarrow$ `Views/Auth/Login.cshtml`)**: Renders and processes login directly on the server (`POST /auth/login`) through **Supabase Auth**. The Supabase-issued access/refresh tokens are used as-is (nothing is re-signed locally) and stored in `HttpOnly; Secure; SameSite=Lax` cookies, then the user is redirected to `/app/journey`. The API validates Supabase access tokens via the project JWKS (`Supabase:JwtSecret` is an optional legacy HS256 fallback) and resolves role/plan from `public.profiles`. Refresh and logout are delegated to Supabase.
   - **React SPA Bootstrap (`SpaBootstrapController`)**: Hydrates `window.__LINGOPRO_INITIAL_AUTH__` on `/app/{**slug}` so the React SPA starts authenticated with 0ms latency.
6. **NUnit 4 Business Unit Tests**
   - `tests/LingoPro.Domain.UnitTests` and `tests/LingoPro.Application.UnitTests` test FSRS-5 memory scheduling, TOEIC/VSTEP scoring, Teacher-only authorization guards, and the multi-level caching behavior pipeline using **NUnit 4** and **NSubstitute**.
