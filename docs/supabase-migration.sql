-- Supabase 마이그레이션: study_sessions 테이블 및 leaderboard 함수
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

-- 3. Leaderboard RPC 함수
CREATE OR REPLACE FUNCTION get_study_leaderboard(row_limit INTEGER)
RETURNS TABLE(user_id TEXT, total BIGINT) AS $$
  SELECT user_id, COALESCE(SUM(duration), 0) AS total
  FROM study_sessions
  WHERE duration IS NOT NULL
  GROUP BY user_id
  ORDER BY total DESC
  LIMIT row_limit;
$$ LANGUAGE sql STABLE;
