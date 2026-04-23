-- Supabase 마이그레이션: study_sessions 테이블
-- 신규 설치 시 실행하는 초기 마이그레이션입니다.
-- Supabase Dashboard > SQL Editor에서 실행하세요.

-- 1. categories 테이블 생성
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  category_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);

-- 2. study_sessions 테이블 생성
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  duration INTEGER
);

-- 3. 인덱스 (조회 성능 최적화)
CREATE INDEX idx_study_sessions_user_active
  ON study_sessions(user_id) WHERE left_at IS NULL;

CREATE INDEX idx_study_sessions_user_duration
  ON study_sessions(user_id) WHERE duration IS NOT NULL;

CREATE INDEX idx_study_sessions_category_user_duration
  ON study_sessions(category_id, user_id) WHERE duration IS NOT NULL;
