# Mash-Up 16기 Discord Bot

Mash-Up 커뮤니티의 디스코드를 활성화하기 위한 봇 프로젝트입니다.

## 기술 스택

- **NestJS** — 백엔드 프레임워크
- **Necord** — NestJS 위에서 Discord.js를 사용하기 위한 래퍼
- **Discord.js** — Discord API 클라이언트
- **Supabase** — 데이터베이스 (추후 연동 예정)

## 프로젝트 구조

```
src/
├── app.module.ts            # 루트 모듈 (Necord 설정, 각 기능 모듈 import)
├── main.ts                  # 엔트리포인트
└── modules/                 # 기능별 모듈 디렉토리
    └── ping/                # 예시: /ping 슬래시 커맨드
        ├── ping.module.ts
        └── ping.commands.ts
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

1. [Discord Developer Portal](https://discord.com/developers/applications)에서 봇 생성
2. Bot 토큰 발급
3. OAuth2 > URL Generator에서 `bot`, `applications.commands` 스코프로 초대 링크 생성 후 서버에 초대

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

## 팀원

| 이름 | 역할 |
|------|------|
| 최재영 | Node 팀 |
| 공진성 | Node 팀 |
| 김수빈 | Node 팀 |
| 이승찬 | Node 팀 |
