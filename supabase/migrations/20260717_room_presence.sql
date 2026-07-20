-- Hub presence: ai đang trong phòng + đang học gì (thưa, không multiplayer move)
-- Client heartbeat ~30–45s; offline nếu last_seen_at > 90s

CREATE TABLE IF NOT EXISTS public.room_presence (
  user_id         uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_id         text NOT NULL,
  display_name    text NOT NULL DEFAULT 'Học viên',
  activity_key    text NOT NULL DEFAULT 'idle',
  activity_label  text NOT NULL DEFAULT 'Đang ở hub',
  last_seen_at    timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS room_presence_room_seen_idx
  ON public.room_presence (room_id, last_seen_at DESC);

COMMENT ON TABLE public.room_presence IS
  'Presence thưa cho hub lớp: tên + activity (vocab/grammar/…). Heartbeat REST, không stream position.';

ALTER TABLE public.room_presence ENABLE ROW LEVEL SECURITY;

-- Đọc: user đã enroll / teacher của classroom = room_id, hoặc room_id = 'lobby'
CREATE POLICY "room_presence_select_same_room"
  ON public.room_presence FOR SELECT
  USING (
    room_id = 'lobby'
    OR EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.classroom_id::text = room_presence.room_id
        AND e.student_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.classrooms c
      WHERE c.id::text = room_presence.room_id
        AND c.teacher_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Upsert chính mình
CREATE POLICY "room_presence_upsert_own"
  ON public.room_presence FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "room_presence_update_own"
  ON public.room_presence FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "room_presence_delete_own"
  ON public.room_presence FOR DELETE
  USING (auth.uid() = user_id);
