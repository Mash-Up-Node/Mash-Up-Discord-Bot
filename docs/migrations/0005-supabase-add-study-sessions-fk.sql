-- Supabase 마이그레이션: study_sessions에 user_id, category_id FK 제약 추가
-- 기존 운영 DB에 적용하는 마이그레이션입니다.
-- Supabase Dashboard > SQL Editor에서 실행하세요.

-- 1. orphan user 백필: study_sessions에는 있는데 users에는 없는 discord_id를 최소 정보로 등록
INSERT INTO users (discord_id, nickname, generation, department, is_admin, score)
SELECT DISTINCT s.user_id, s.user_id, 0, 'Unknown', false, 0
FROM study_sessions s
LEFT JOIN users u ON u.discord_id = s.user_id
WHERE u.discord_id IS NULL;

-- 2. user_id FK 제약 추가
ALTER TABLE study_sessions
  ADD CONSTRAINT fk_study_sessions_user
  FOREIGN KEY (user_id) REFERENCES users(discord_id);

-- 3. category_id FK 제약 추가
-- (categories.category_id가 UNIQUE이므로 referencedColumnName으로 사용 가능)
ALTER TABLE study_sessions
  ADD CONSTRAINT fk_study_sessions_category
  FOREIGN KEY (category_id) REFERENCES categories(category_id);
