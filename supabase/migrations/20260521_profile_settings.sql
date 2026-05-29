-- Add learning settings to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_goal integer DEFAULT 10;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_hour integer DEFAULT 20;
