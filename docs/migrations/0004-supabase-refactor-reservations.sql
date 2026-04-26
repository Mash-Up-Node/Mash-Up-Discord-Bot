-- Supabase 마이그레이션: reservation 관련 테이블
-- Supabase Dashboard > SQL Editor에서 실행하세요.

-- 1. 테이블 생성
CREATE TABLE channel_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL,
  creator_user_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('once', 'weekly')),
  title TEXT NOT NULL,
  reminder_message TEXT,
  reminder_offset_minutes INTEGER NOT NULL DEFAULT 10,
  day_of_week INTEGER CHECK (day_of_week IS NULL OR day_of_week BETWEEN 1 AND 7),
  time_of_day TEXT,
  next_scheduled_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reservation_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES channel_reservations(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 인덱스 (조회 성능 최적화)
CREATE INDEX idx_channel_reservations_channel_next_scheduled
  ON channel_reservations(channel_id, next_scheduled_at);

CREATE INDEX idx_channel_reservations_next_scheduled
  ON channel_reservations(next_scheduled_at);

CREATE UNIQUE INDEX idx_reservation_notifications_reservation_scheduled
  ON reservation_notifications(reservation_id, scheduled_at);

CREATE INDEX idx_reservation_notifications_reservation
  ON reservation_notifications(reservation_id);
