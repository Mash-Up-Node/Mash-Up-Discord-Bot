# 공부방 시간 측정 모듈

디스코드 음성 채널 입장/퇴장을 감지하여 공부 시간을 자동으로 기록하는 기능입니다.

## 환경변수

| 변수명 | 설명 |
|--------|------|
| `STUDY_CATEGORY_ID` | 추적 대상 음성채널 카테고리의 Discord ID |

카테고리 ID 확인 방법: 디스코드 설정 > 고급 > 개발자 모드 켜기 → 카테고리 우클릭 > ID 복사

## 슬래시 커맨드

### `/공부시간`

누적 공부 시간을 조회합니다.

- **옵션**: `user` (선택) — 다른 사용자를 지정하면 해당 사용자의 시간을 조회
- **예시 응답**: `최재영님의 누적 공부 시간: 2시간 30분 45초`

### `/공부순위`

전체 공부 시간 순위표를 표시합니다 (상위 10명).

- **예시 응답**:
  ```
  공부 시간 순위표
  1. 최재영 — 2시간 30분 45초
  2. 공진성 — 1시간 15분 20초
  3. 김수빈 — 45분 10초
  ```

## 동작 방식

### 이벤트 처리

`voiceStateUpdate` 이벤트를 감지하여 `STUDY_CATEGORY_ID` 카테고리 내 음성채널만 추적합니다.

| 상황 | 동작 |
|------|------|
| 카테고리 밖 → 카테고리 안 입장 | 새 세션 생성 (입장 시간 기록) |
| 카테고리 안 → 카테고리 밖/연결 해제 | 세션 종료 (퇴장 시간 + duration 계산) |
| 카테고리 내 채널 이동 (A → B) | 기존 세션 종료 + 새 세션 생성 |
| 카테고리 밖 → 카테고리 밖 | 무시 |

### 데이터 모델

```
study_sessions
├── id          TEXT (PK, UUID)
├── user_id     TEXT (Discord 유저 ID)
├── channel_id  TEXT (Discord 채널 ID)
├── joined_at   TEXT (ISO 8601)
├── left_at     TEXT (ISO 8601, nullable)
└── duration    INTEGER (초 단위, nullable)
```

## 아키텍처

Adapter 패턴으로 DB 교체가 용이하도록 설계되어 있습니다.

```
StudyService (비즈니스 로직)
    ↓ @Inject(STUDY_SESSION_REPOSITORY)
StudySessionRepository (인터페이스)
    ↓ implements
SqliteStudySessionRepository (로컬 개발)
SupabaseStudySessionRepository (프로덕션, 추후 구현)
```

### 모듈 구조

```
src/modules/study/
├── study.module.ts              # NestJS 모듈 정의
├── study.service.ts             # 비즈니스 로직
├── study.listener.ts            # voiceStateUpdate 이벤트 리스너
├── study.commands.ts            # 슬래시 커맨드 (/공부시간, /공부순위)
├── dto/
│   └── study-time.dto.ts        # /공부시간 옵션 DTO
├── entities/
│   └── study-session.entity.ts  # StudySession, LeaderboardEntry 타입
├── interfaces/
│   └── study-session.repository.ts  # Repository 인터페이스 + DI 토큰
├── repositories/
│   └── sqlite-study-session.repository.ts  # SQLite 구현체
└── __tests__/                   # 테스트 (38개)
```
