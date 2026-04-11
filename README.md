# Mash-Up 16기 Discord Bot

Mash-Up 커뮤니티의 디스코드를 활성화하기 위한 봇 프로젝트입니다.

## 기술 스택

- **NestJS** — 백엔드 프레임워크
- **Necord** — NestJS 위에서 Discord.js를 사용하기 위한 래퍼
- **Discord.js** — Discord API 클라이언트
- **Supabase** — 데이터베이스 (추후 연동 예정)

## 기능

| 기능 | 커맨드 | 설명 | 문서 |
|------|--------|------|------|
| Ping | `/ping` | 봇 동작 확인 | - |
| 공부시간 측정 | `/공부시간` | 음성채널 입장/퇴장 시간 자동 기록 및 누적 시간 조회 | [상세 문서](docs/study-module.md) |
| 공부순위 | `/공부순위` | 공부 시간 상위 10명 순위표 | [상세 문서](docs/study-module.md) |

## 프로젝트 구조

```
src/
├── app.module.ts            # 루트 모듈 (Necord 설정, 각 기능 모듈 import)
├── main.ts                  # 엔트리포인트
├── constants/               # 상수 정의
└── modules/                 # 기능별 모듈 디렉토리
    ├── ping/                # /ping 슬래시 커맨드
    └── study/               # 공부방 시간 측정
```

각 기능은 `src/modules/{기능명}/` 폴더에 NestJS 모듈로 독립 개발합니다.
모듈 단위로 분리되어 있으므로 각자 작업 시 충돌을 최소화할 수 있습니다.

## 새 기능 모듈 추가 방법

1. `src/modules/{기능명}/` 폴더 생성
2. `{기능명}.module.ts` — NestJS 모듈 정의
3. `{기능명}.commands.ts` — 슬래시 커맨드 정의
4. `src/app.module.ts`의 `imports`에 모듈 추가

## 시작하기

### 사전 준비

봇 생성, 토큰 발급, 권한 설정, 서버 초대 방법은 [봇 생성 가이드](docs/bot-setup-guide.md)를 참고하세요.

### 설치 및 실행

```bash
# 패키지 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일에 DISCORD_TOKEN 입력

# 개발 모드 실행
npm run start:dev

# 프로덕션 빌드
npm run build
npm run start:prod
```

## 문서

- [봇 생성 가이드](docs/bot-setup-guide.md)
- [공부방 시간 측정 모듈](docs/study-module.md)
- [테스트 가이드](docs/testing-guide.md)
- [Supabase 마이그레이션 SQL](docs/supabase-migration.sql)

## 팀원

| 이름 | 역할 |
|------|------|
| 최재영 | Node 팀 |
| 공진성 | Node 팀 |
| 김수빈 | Node 팀 |
| 이승찬 | Node 팀 |
