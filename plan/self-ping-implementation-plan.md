# [구현 계획] Render Sleep 방지 Self-Ping 기능

> 참조 PRD: 디스코드 채널에서 공유된 "Self-Ping (자가 호출) 기능" PRD
> 작성일: 2026-04-19

---

## 1. 아키텍처 결정 (Architecture Decisions)

### 1.1. 모듈 구성: 신규 `HealthModule` 도입

기존 `PingModule`(`src/modules/ping/`)은 Discord `/ping` **슬래시 커맨드** 전용이다. 인프라 keep-alive 용 HTTP 엔드포인트는 도메인이 다르므로 분리한다.

```
src/modules/
├── ping/          ← Discord 커맨드 (그대로 유지)
├── health/        ← 신규: HTTP 헬스체크 (단일 책임)
│   ├── health.controller.ts
│   └── health.module.ts
└── keep-alive/    ← 신규: 자가 호출 cron (단일 책임)
    ├── keep-alive.service.ts
    ├── keep-alive.module.ts
    └── __tests__/
        └── keep-alive.service.spec.ts
```

> 리뷰 피드백 반영: HealthController(엔드포인트 제공)와 keep-alive cron(외부 발신 작업)은 책임이 다르므로 모듈 분리.

### 1.2. 기술 선택

| 항목 | 선택 | 대안 | 결정 근거 |
|---|---|---|---|
| HTTP 라우트 | NestJS `@Controller` | Express raw handler | `@nestjs/platform-express`가 이미 도입됨. NestJS 컨벤션 준수 |
| 스케줄러 | `@nestjs/schedule` | `node-cron`, `setInterval` | NestJS 공식 모듈, 데코레이터(`@Cron`) 기반으로 가독성 우수 |
| HTTP 클라이언트 | Node native `fetch` | `axios`, `@nestjs/axios` | Node 22 기본 제공. 의존성 최소화 (단일 GET 요청에 axios는 과함) |
| 자기 URL 설정 | `RENDER_EXTERNAL_URL` env | 직접 `SELF_URL` 정의 | Render가 자동 주입하는 빌트인 환경변수 활용 ([Render docs](https://render.com/docs/environment-variables)) |
| 실행 주기 | **10분** (`EVERY_10_MINUTES`) | 14분 | 15분 타임아웃 대비 50% 마진. 네트워크 지연·일시 장애 흡수 |

### 1.3. 환경 분기 전략

- 로컬 개발(`pnpm start:dev`)·CI 환경에서는 self-ping 비활성화
- 가드 조건: `RENDER_EXTERNAL_URL` 환경변수 부재 시 skip
- 명시적 로깅으로 "왜 ping이 동작하지 않는지" 추적 가능하게

---

## 2. 파일별 변경 사항 (File-level Changes)

### 2.1. 신규 파일

#### `src/modules/health/health.controller.ts`
```typescript
import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  check() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
```
- 경로는 PRD의 `/ping` 대신 **`/health`** 사용 → Discord `/ping` 커맨드와 명확히 구분
- 응답 본문은 디버깅 용도(uptime 포함)로 약간의 정보 제공. 리소스 부담 무시 가능

#### `src/modules/health/self-ping.service.ts`
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SelfPingService {
  private readonly logger = new Logger(SelfPingService.name);

  constructor(private readonly config: ConfigService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async ping(): Promise<void> {
    const baseUrl = this.config.get<string>('RENDER_EXTERNAL_URL');
    if (!baseUrl) {
      this.logger.debug('Self-ping skipped: RENDER_EXTERNAL_URL not set');
      return;
    }

    const url = `${baseUrl}/health`;
    try {
      const res = await fetch(url);
      this.logger.log(`Self-ping → ${res.status}`);
    } catch (err) {
      this.logger.warn(
        `Self-ping failed: ${(err as Error).message}`,
      );
    }
  }
}
```
- 핵심: `try/catch`로 실패 격리 → 네트워크 장애가 봇 프로세스를 죽이지 않음
- 로깅 레벨: 성공은 `log`(추후 `debug`로 낮춰도 OK), 실패만 `warn`

#### `src/modules/health/health.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { SelfPingService } from './self-ping.service';

@Module({
  controllers: [HealthController],
  providers: [SelfPingService],
})
export class HealthModule {}
```
- `ConfigModule`은 `app.module.ts:11`에서 `isGlobal: true`로 설정되어 별도 import 불필요

#### `src/modules/health/__tests__/self-ping.service.spec.ts`
테스트 케이스:
1. `RENDER_EXTERNAL_URL` 미설정 시 `fetch` 호출 안 됨
2. URL 설정 시 `${url}/health` 정확히 호출
3. `fetch` 거부 시 throw 하지 않고 `warn` 로깅

`global.fetch`를 `jest.fn()`으로 모킹.

### 2.2. 수정 파일

#### `src/app.module.ts`
```diff
+ import { ScheduleModule } from '@nestjs/schedule';
+ import { HealthModule } from './modules/health/health.module';

  @Module({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
+     ScheduleModule.forRoot(),
      DatabaseModule.forRoot(),
      NecordModule.forRootAsync({...}),
      PingModule,
      StudyModule,
+     HealthModule,
    ],
  })
```

#### `package.json`
```bash
pnpm add @nestjs/schedule
```
- 현재 사용 중인 `@nestjs/*` 11.x 라인과 호환되는 버전(`^6.x` 또는 최신) 자동 설치

#### `README.md` (선택)
환경변수 섹션이 없다면 추가:
- `RENDER_EXTERNAL_URL` — Render에서 자동 주입. 로컬에서는 미설정 시 self-ping 자동 비활성화

---

## 3. 구현 순서 (Step-by-step)

1. **의존성 설치**
   ```bash
   pnpm add @nestjs/schedule
   ```

2. **HealthController 작성** → 로컬 검증
   ```bash
   pnpm start:dev
   curl http://localhost:3000/health
   # → {"status":"ok","uptime":1.23,"timestamp":"..."}
   ```

3. **SelfPingService 작성**

4. **HealthModule + ScheduleModule 등록** → `app.module.ts` 수정

5. **단위 테스트 작성·통과**
   ```bash
   pnpm test self-ping
   ```

6. **로컬 end-to-end 검증**
   ```bash
   RENDER_EXTERNAL_URL=http://localhost:3000 pnpm start:dev
   # 콘솔에 10분 간격으로 "Self-ping → 200" 로그 확인
   # (테스트 시 일시적으로 EVERY_MINUTE로 바꿔 빠르게 검증 권장)
   ```

7. **PR 작성 및 main 머지**

8. **배포 후 24시간 모니터링**
   - Render Logs에서 10분 간격 ping 로그
   - Discord에서 cold-start 응답 지연 사라졌는지 확인

---

## 4. 리스크 및 대응 (Risks)

| 리스크 | 영향 | 대응 |
|---|---|---|
| **영구 수면** (PRD 5번): 정기 점검·750h 한도 초과로 인스턴스 완전 종료 시 cron도 중지 | 수동 개입 전까지 봇 다운 | 1차: 수동 깨우기. 2차: 외부 모니터링(UptimeRobot) 보조 도입 추후 검토 |
| `RENDER_EXTERNAL_URL` 미주입 (Render 설정 변경 등) | self-ping 미동작 | 매 cron마다 `debug` 로그로 사유 명시 → 로그 검색 가능 |
| Self-ping 로그가 운영 로그를 덮음 (10분당 1줄 = 일 144줄) | 가독성 저하 | 안정화 후 성공 로그를 `log` → `debug` 레벨로 낮춤 |
| Discord `/ping`과 HTTP 엔드포인트 혼동 | 개발자 혼란 | HTTP는 **`/health`** 경로 채택 (PRD의 `/ping` 대신) |
| `@nestjs/schedule` 11.x 호환 버전 불일치 | 빌드 실패 | `pnpm add` 시 peer dep 자동 해결. 실패 시 명시적 버전 핀(`^4` 또는 `^6`) 사용 |
| 봇 자기 자신을 호출하므로 부하 발생 | 무시 가능 (10분 1회) | 추가 대응 불필요 |

---

## 5. 검증 체크리스트 (Acceptance Criteria)

- [ ] `curl http://localhost:3000/health` → `200 OK` + JSON 응답
- [ ] `RENDER_EXTERNAL_URL` 없을 때 cron이 `fetch` 호출하지 않음 (단위 테스트)
- [ ] `RENDER_EXTERNAL_URL` 있을 때 정확한 URL로 호출 (단위 테스트)
- [ ] `fetch` 실패가 throw로 전파되지 않음 (단위 테스트)
- [ ] 기존 테스트 스위트 무중단 통과
- [ ] 배포 후 Render Logs에서 10분 간격 ping 로그 관찰
- [ ] 24시간 동안 Discord 명령어가 cold-start 없이 응답

---

## 6. 향후 확장 여지 (Out of Scope)

- 외부 모니터링(UptimeRobot) 이중화 — 영구 수면 리스크 완화
- `/health`에 DB 연결 상태 확인 추가 — 단순 keep-alive를 넘어 헬스체크로 격상
- Render 유료 플랜 전환 시 본 기능 제거 (always-on이면 불필요)
