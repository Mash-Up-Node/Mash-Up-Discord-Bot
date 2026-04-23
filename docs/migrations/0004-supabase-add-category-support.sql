-- Supabase 마이그레이션: 카테고리 지원 추가
-- 기존 운영 DB에 적용하는 마이그레이션입니다.
-- Supabase Dashboard > SQL Editor에서 실행하세요.

-- 1. categories 테이블 생성
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  category_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);

-- 2. study_sessions에 category_id 컬럼 추가
-- Step 1: nullable로 컬럼 추가
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS category_id TEXT;

-- Step 2: 기존 데이터 backfill (기존 행은 현재 운영 중인 카테고리 ID로 채움)
UPDATE study_sessions SET category_id = '782054242399158333' WHERE category_id IS NULL;

-- Step 3: 데이터를 채운 뒤 NOT NULL 제약 적용
ALTER TABLE study_sessions ALTER COLUMN category_id SET NOT NULL;

-- 3. 카테고리별 집계 성능용 인덱스
CREATE INDEX IF NOT EXISTS idx_study_sessions_category_user_duration
  ON study_sessions(category_id, user_id) WHERE duration IS NOT NULL;
