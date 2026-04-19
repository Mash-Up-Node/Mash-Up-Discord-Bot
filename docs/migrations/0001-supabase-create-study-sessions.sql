-- Supabase 마이그레이션: study_sessions 테이블
-- Supabase Dashboard > SQL Editor에서 실행하세요.

-- 1. 테이블 생성
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  duration INTEGER
);

-- 2. 인덱스 (조회 성능 최적화)
CREATE INDEX idx_study_sessions_user_active
  ON study_sessions(user_id) WHERE left_at IS NULL;

CREATE INDEX idx_study_sessions_user_duration
  ON study_sessions(user_id) WHERE duration IS NOT NULL;

-- 3. categories 테이블 (공부 시간 추적 대상 Discord 카테고리 목록)
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  category_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);

-- 4. study_sessions에 category_id 컬럼 추가 (카테고리별 집계 지원)
ALTER TABLE study_sessions ADD COLUMN category_id TEXT;
ALTER TABLE study_sessions ALTER COLUMN category_id SET NOT NULL;

-- 5. 카테고리별 집계 성능용 인덱스
CREATE INDEX idx_study_sessions_category_user_duration
  ON study_sessions(category_id, user_id) WHERE duration IS NOT NULL;

