# SePay → auto kích hoạt Pro

## Luồng

```
HV tạo đơn /upgrade → nội dung CK: LINGOPRO <8 ký tự đầu order id>
→ HV chuyển khoản MB
→ SePay bắt giao dịch → POST webhook
→ /api/billing/webhook khớp mã + số tiền → confirm_paid_order → plan = pro
```

## 1. URL webhook (production)

```
https://lingopro.online/api/billing/webhook
```

Method: **POST** · JSON

## 2. Secret (bắt buộc khớp)

Trên **Vercel → Project → Settings → Environment Variables (Production)**:

| Key | Giá trị |
|-----|---------|
| `WEBHOOK_SECRET` | Chuỗi mạnh tự đặt (vd. random 32+ ký tự) — **không** để `test_secret` / rỗng |

Trên **SePay Dashboard → Webhooks / Tích hợp**:

- URL: như trên  
- **API Key / Authorization** gửi kèm request = **đúng** `WEBHOOK_SECRET` trên Vercel  

Code chấp nhận header:

- `Authorization: Apikey <WEBHOOK_SECRET>` (SePay)
- `Authorization: Bearer <WEBHOOK_SECRET>`
- `secure-token` / `x-webhook-secret` / `x-api-key`

Fallback: nếu SePay dán nhầm **SEPAY_API_KEY** vào ô webhook key, server cũng thử match `SEPAY_API_KEY` (không khuyến nghị lâu dài).

Sau khi đổi env Vercel: **Redeploy**.

## 3. Tài khoản ngân hàng trên SePay

- Liên kết đúng STK **0949317036** (MB) — trùng `NEXT_PUBLIC_BANK_ACCOUNT` / VietQR trên web.
- Bật **thông báo giao dịch vào** (incoming).

## 4. Nội dung chuyển khoản

App hiển thị: `LINGOPRO ABCDEF12` (8 hex đầu UUID đơn).

Bank có thể thêm chữ:

```
CUSTOMER LINGOPRO 1999D42A. TU: HUYNH BAO TRAN
```

Webhook đã parse được dạng này.

## 5. Test nhanh

```bash
curl -X POST https://lingopro.online/api/billing/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Apikey YOUR_WEBHOOK_SECRET" \
  -d '{
    "transferType": "in",
    "transferAmount": 79000,
    "content": "CUSTOMER LINGOPRO 1999D42A. TU: TEST",
    "referenceCode": "FT-TEST-001",
    "id": 123
  }'
```

Kỳ vọng: `processed >= 1` nếu còn đơn **pending** đúng prefix + đúng tiền.

## 6. Khi auto fail

1. Vercel Logs → filter `[Webhook]`  
2. Admin Billing → Confirm thủ công đơn pending  
3. Checklist: secret khớp · URL đúng · SePay có event · đơn còn `pending` · amount khớp

## 7. Checklist ops lần đầu

- [ ] `WEBHOOK_SECRET` production ≠ rỗng, ≠ `test_secret`
- [ ] SePay webhook URL = `https://lingopro.online/api/billing/webhook`
- [ ] SePay API key webhook = `WEBHOOK_SECRET`
- [ ] STK MB đã link SePay
- [ ] Redeploy sau khi set env
- [ ] Test curl / CK 1k thử (đơn pending test) rồi confirm tay nếu cần
