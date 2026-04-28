# [PRD] 스코어 개발 시스템 (Score Development System)

## 0. 구현 현황

| 항목 | 상태 | PR / 비고 |
| :--- | :--- | :--- |
| 데이터 모델 (Users, Teams) | 완료 | main 머지됨 |
| 어드민 권한 부여/해제 | 완료 | PR #18 (`/admin-grant`, `/admin-revoke`) |
| 멤버 동기화 (cron) | 완료 | PR #18 (`UserScheduler` KST 매일 00:00) |
| `/register-member` | 완료 | PR #18 |
| `/team-build` | 완료 | PR #18 |
| `/team-list` | 완료 | PR #18 |
| `/my-score` | 완료 | PR #12 |
| `/score-rank` | 완료 | PR #12 |
| `/시즌-종료` | 완료 | PR #12 (이전 명: `/score-reset`) |
| `addScore` Internal API | 완료 | PR #12, `ScoreService.addScore()` |
| `Study Entity → User FK` | 진행 중 | 본 브랜치 (`refactor/study-user-fk`) |
| `Study Entity → Category FK` | 진행 중 | 본 브랜치 (audit에서 발견된 추가 항목) |
| Study → Score 연동 | **미구현** | 섹션 3.3 참조. 스터디 활동 시 `ScoreService.addScore()` 호출 필요 |
| `/help` 명령어 | **미구현** | 섹션 3.4 참조 |

## 1. 프로젝트 개요
- **배경**: Mash-Up 16기 프로젝트 팀 간의 활동성을 높이고 개인의 기여도를 가시화함.
- **목표**: 
    - 개인별 점수 적립을 통한 팀 단위 합산 랭킹 시스템 구축.
    - 1:N (Team:User) 관계의 단순하고 효율적인 데이터 구조 채택.
    - 타 모듈에서 쉽게 연동 가능한 점수 적립 인터페이스 제공.

## 2. 사용자 역할 및 권한 체계
- **일반 사용자**: `/help`, `/team-list`, `/score-rank`, `/my-score` 등 조회 기능.
- **관리자 (Admin)**: 
    - 권한 부여: 기존 어드민이 `/admin-grant user:@xxx`로 다른 멤버를 승격. 초기 어드민 1명만 DB에서 직접 `is_admin = true`로 설정.
    - 권한 해제: 기존 어드민이 `/admin-revoke user:@xxx`로 해제 가능.
    - 권한 범위: 멤버 수동 등록, 팀 빌딩, 시즌 종료, 어드민 부여/해제.

## 3. 핵심 기능 상세

### 3.1. 멤버 관리 및 자동 분류
- **자동 동기화 (cron)**: 
    - `UserScheduler.syncMembersDaily`가 KST 매일 00:00 실행.
    - 봇이 속한 모든 길드의 멤버를 `Users` 테이블에 등록/갱신.
    - **직무 파싱**: 닉네임 Prefix(`[직무]`) 기반 자동 분류 (정규식: `^\[(노드|스프링|디자인|아오스|안드|웹)\]`).
    - **기수 값**: `MASHUP_GENERATION` 환경변수로 제어.
    - **예외 처리**: 파싱 실패 시 `Unknown` 처리.
- **즉시 등록 (`UserService.ensureUser`)**:
    - 신규 멤버가 cron 사이에 voice 채널에 입장하는 경우, Study 리스너가 `ensureUser`를 호출해 사전 등록.
    - displayName에서 직무를 파싱, generation은 `MASHUP_GENERATION` 적용.
- **수동 등록/수정 (`/register-member`)**: 특정 사용자의 직무나 기수를 직접 수정 (관리자 전용).

### 3.2. 프로젝트 팀 빌딩 (`/team-build`)
- **방식**: `/team-build [팀명] [@멤버1] [@멤버2] ...`
- **구조**: 유저의 `teamId`를 업데이트하여 특정 팀에 귀속시킴 (1인 1팀 원칙).

### 3.3. 점수 적립 시스템 (Internal API)
- **인터페이스**: `addScore(userId: string, amount: number)` — 구현 완료 (`ScoreService`)
- **비즈니스 로직**:
    1. 해당 유저(`userId`)의 개인 점수(`score`)를 `amount`만큼 증가.
    2. **팀 점수 산출**: 리더보드 조회 시 동일한 `teamId`를 가진 유저들의 점수를 합산하여 출력.
- **[미구현] Study 모듈 연동**:
    - Study 모듈에서 스터디 활동(출석, 과제 제출 등) 시 `ScoreService.addScore()`를 호출하여 점수 적립.
    - `ScoreModule`이 `ScoreService`를 export하므로, Study 모듈에서 `ScoreModule`을 import하면 사용 가능.
- **Study Entity FK** (본 브랜치):
    - `study_sessions.user_id` → `users.discord_id` FK 추가.
    - `study_sessions.category_id` → `categories.category_id` FK 추가 (audit에서 발견).
    - 신규 멤버가 cron 동기화 전에 입장해도 FK 위반되지 않도록 `UserService.ensureUser` 도입.
    - 기존 운영 DB는 `docs/migrations/0005-supabase-add-study-sessions-fk.sql`로 백필 + 제약 추가.

### 3.4. [미구현] 통합 도움말 (`/help`)
- **내용**: 지원되는 직무 태그 리스트, 점수 획득 방법, 어드민 권한 부여 방법 등을 종합 안내.
- **확장성**: 다른 모듈 개발자가 자신의 기능을 설명할 수 있는 섹션 제공.

## 4. 데이터 모델 (Schema)

### 4.1. Users (사용자 정보)
- `discordId` (PK): 디스코드 고유 ID
- `nickname`: 서버 내 별명 (파싱된 이름)
- `generation`: 기수 (`MASHUP_GENERATION` 기본값)
- `department`: 직무 (노드, 스프링, 디자인, 아오스, 안드, 웹, Unknown)
- `isAdmin`: 관리자 여부
- `teamId`: 소속 팀 ID (FK → Teams.id, Nullable)
- `score`: 개인 누적 점수 (기본값 0)

### 4.2. Teams (프로젝트 팀)
- `id` (PK): 팀 고유 ID (auto-increment)
- `name`: 팀명 (UNIQUE)

### 4.3. StudySessions (스터디 세션 — 참고)
- `id` (PK, UUID)
- `userId` (FK → Users.discordId): 스터디한 유저
- `channelId`: 음성 채널 ID (FK 없음 — 동적 voice 채널)
- `categoryId` (FK → Categories.categoryId): 스터디 카테고리
- `joinedAt`, `leftAt`, `duration`

## 5. 명령어 명세

| 명령어 | 파라미터 | 설명 | 권한 | 상태 |
| :--- | :--- | :--- | :--- | :--- |
| `/help` | - | 전체 가이드 및 직무 태그 안내 | 전체 | 미구현 |
| `/admin-grant` | `user` | 대상 유저에게 관리자 권한 부여 | 관리자 | PR #18 |
| `/admin-revoke` | `user` | 대상 유저의 관리자 권한 해제 | 관리자 | PR #18 |
| `/register-member` | `user`, `department`, `generation` | 멤버 정보 수동 등록/수정 | 관리자 | PR #18 |
| `/team-build` | `name`, `members` | 팀 생성 및 멤버 귀속 | 관리자 | PR #18 |
| `/team-list` | - | 팀별 멤버 구성 및 개인별 점수 확인 | 전체 | PR #18 |
| `/score-rank` | - | 팀별 합산 점수 기준 랭킹 확인 | 전체 | PR #12 |
| `/my-score` | - | 내 개인 점수 및 소속 팀 확인 | 전체 | PR #12 |
| `/시즌-종료` | - | 시즌을 종료하고 모든 점수와 팀을 초기화 | 관리자 | PR #12 |
