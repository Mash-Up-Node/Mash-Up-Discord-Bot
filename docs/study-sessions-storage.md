# study_sessions 저장 방식

## 테이블 구조

| 컬럼 | 타입 | 의미 |
|---|---|---|
| `id` | UUID | PK, 세션마다 자동 생성 |
| `user_id` | TEXT | Discord 사용자 ID |
| `channel_id` | TEXT | Discord 음성채널 ID (실제 접속한 방) |
| `category_id` | TEXT | Discord 카테고리 ID (`categories.category_id` 참조) |
| `joined_at` | TIMESTAMPTZ | 입장 시각 |
| `left_at` | TIMESTAMPTZ \| NULL | 퇴장 시각. NULL이면 진행 중 |
| `duration` | INTEGER \| NULL | 초 단위 머문 시간. `left_at - joined_at`. NULL이면 진행 중 |

## channel_id vs category_id

Discord 계층:
```
📁 Node (카테고리)        ← category_id = 782054242399158333
  ├ 🔊 공부방1             ← channel_id = 1111...
  ├ 🔊 공부방2             ← channel_id = 2222...
```

- `category_id`: 추적 대상 카테고리 식별. `CategoryService.has()`로 필터링
- `channel_id`: 실제 접속한 음성채널 식별. 한 카테고리에 여러 개 가능

## 저장 흐름

`voiceStateUpdate` 이벤트 기준, 각 케이스마다 row가 이렇게 움직임:

### 1. 입장 (카테고리 밖 → 안)
새 row insert:
- `joined_at = now()`
- `left_at = NULL`, `duration = NULL` (진행 중 표시)
- `category_id`, `channel_id` 현재 접속 채널 정보

### 2. 퇴장 (카테고리 안 → 밖, 또는 연결 해제)
해당 user의 `left_at IS NULL`인 row 업데이트:
- `left_at = now()`
- `duration = (left_at - joined_at) / 1000` 초

### 3. 같은 카테고리 내 채널 이동
입장과 퇴장이 동시에 일어남:
- 기존 진행 중 row를 먼저 종료 (`left_at`, `duration` 채움)
- 새 `channel_id`로 새 row insert

즉 **한 번의 음성채널 참여마다 row 하나**가 생기고, 채널을 옮기면 여러 row로 쪼개짐.

### 4. 카테고리 밖 → 밖
무시 (row 변화 없음)

## 집계

`duration IS NOT NULL`(종료된 세션)만 집계 대상.

### `/공부시간 [user] [category]`
```sql
SELECT COALESCE(SUM(duration), 0)
FROM study_sessions
WHERE user_id = ?
  AND duration IS NOT NULL
  [AND category_id = ?]  -- 카테고리 옵션 지정 시
```

### `/공부순위 [category]`
```sql
SELECT user_id, COALESCE(SUM(duration), 0) AS total
FROM study_sessions
WHERE duration IS NOT NULL
  [AND category_id = ?]
GROUP BY user_id
ORDER BY total DESC
LIMIT ?
```

## 트레이드오프

현재 구조는 **세션마다 1 row**라 시점별 분석(예: "지난주 공부시간")이 가능한 대신 row 개수가 계속 늘어남. `(user_id, channel_id)` UNIQUE로 묶어 duration 누적만 하는 설계도 고려했으나, 시점 기록 유연성을 잃어 보류.
