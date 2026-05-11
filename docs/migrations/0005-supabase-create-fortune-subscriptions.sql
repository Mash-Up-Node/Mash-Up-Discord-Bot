-- Supabase 마이그레이션: 운세 구독 테이블
-- 기존 운영 DB에 적용하는 마이그레이션입니다.
-- Supabase Dashboard > SQL Editor에서 실행하세요.

CREATE TABLE IF NOT EXISTS fortune_subscriptions (
  discord_id TEXT PRIMARY KEY,
  gender TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
