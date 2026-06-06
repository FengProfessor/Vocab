-- Chống gửi push nhắc-ôn-tập TRÙNG khi chạy nhiều nguồn cron (GitHub Actions + cron-job.org)
-- cho cùng 1 mốc giờ. Lưu "slot" cuối cùng đã nhắc cho mỗi user, dạng 'YYYY-MM-DD-H' (giờ VN).
-- Route /api/cron/push-due claim slot bằng UPDATE có điều kiện (atomic) trước khi gửi → chỉ
-- nguồn nào claim được mới gửi; nguồn còn lại thấy slot trùng → skip.

alter table public.profiles
  add column if not exists last_due_push_slot text;

comment on column public.profiles.last_due_push_slot is
  'Mốc nhắc ôn tập gần nhất đã gửi (YYYY-MM-DD-H giờ VN). Dùng để khử push trùng đa nguồn cron.';
