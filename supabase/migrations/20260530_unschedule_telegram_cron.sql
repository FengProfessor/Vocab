-- Gỡ pg_cron job Telegram cũ.
-- Lý do: push notification đã chuyển hẳn sang FCM (route /api/cron/push-due).
-- Route /api/cron/telegram-due đã bị xóa, nhưng 2 job 30s (telegram_due_30s_A/B
-- từ migration 20260411) vẫn gọi domain cũ lingopro-nu.vercel.app mỗi 30 giây
-- → 404 vô ích + tốn net.http_get. Gỡ cả hai.

DO $$
BEGIN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname LIKE 'telegram_due_30s_%';
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
