# Vercel cost guard (Pro $20 credit)

Mục tiêu: giữ usage trong **Included Credit $20**, on-demand ≈ $0.

## Đã ship (code)

| Thay đổi | Tác dụng |
|----------|----------|
| `resolveImageSrc` — CDN load thẳng | Flashcard/dict/grammar **không** qua function nếu Supabase/Pixabay/… |
| image-proxy 302 redirect CDN | Client cũ vẫn proxy URL → redirect nhẹ |
| Cache headers mạnh TTS + proxy | Cache HIT = ít Fluid CPU |
| Presence 90s / poll 60s + pause tab ẩn | Bớt `/api/hub/presence` |
| Suggest debounce 400ms | Bớt autocomplete API |

## Vẫn tốn (chấp nhận / theo dõi)

- AI dictionary / AI sentence (khi user bấm)
- Webhook, cron, auth
- Bot `/api/bot/*` nếu còn trỏ **prod** → **TẮT**

## Dashboard canh

Vercel → Usage (chu kỳ):

| Metric | Vàng | Đỏ |
|--------|------|-----|
| Included credit used | > $10 giữa tháng | > $16 |
| Fluid Active CPU | tăng dốc | gần hết allowance |
| Function Invocations | > 500k sớm | > 800k |

## Ops

1. Không chạy Tampermonkey bot `BASE_URL=lingopro.online`
2. Không load-test prod
3. Preview deploy ít (mỗi preview cũng tốn)

## Sau deploy

Deploy production → test flashcard: Network tab ảnh nên **host supabase/pixabay** chứ không phải `/api/image-proxy` (trừ host lạ).
