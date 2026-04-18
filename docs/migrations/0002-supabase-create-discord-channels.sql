-- Supabase 마이그레이션: discord_channels 테이블
-- Supabase Dashboard > SQL Editor에서 실행하세요.

-- 1. 테이블 생성
CREATE TABLE discord_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
