# 테스트 가이드

## 테스트 실행

```bash
# 단위 테스트 전체 실행
npm run test

# 특정 파일만 실행
npx jest study.service.spec --verbose

# 특정 모듈만 실행
npx jest src/modules/study/ --verbose

# Supabase 연결 테스트 (e2e)
npm run test:supabase
```

## 테스트 파일 컨벤션

| 종류 | 파일명 패턴 | 위치 | 설명 |
|------|------------|------|------|
| 단위 테스트 | `*.spec.ts` | `__tests__/` | mock 기반, 외부 의존성 없음 |
| E2E 테스트 | `*.e2e-spec.ts` | `__tests__/` | 실제 외부 서비스 연결 |

- 단위 테스트는 `npm run test`로 실행 (CI에서도 실행됨)
- E2E 테스트는 `npm run test:supabase`로 별도 실행 (환경변수 필요)

## 테스트 작성 규칙

### 1. 디렉토리 구조

각 모듈 안에 `__tests__/` 폴더를 만들어 테스트 파일을 둔다.

```
src/modules/study/
├── __tests__/
│   ├── study.service.spec.ts          # 단위
│   ├── study.listener.spec.ts         # 단위
│   ├── study.commands.spec.ts         # 단위
│   └── supabase-study-session.repository.e2e-spec.ts  # e2e
├── study.service.ts
└── ...
```

### 2. describe 구조

```typescript
describe('클래스명', () => {
  describe('메서드명', () => {
    it('한글로 동작을 설명한다', async () => {
      // given - 준비
      // when - 실행
      // then - 검증
    });
  });
});
```

### 3. 외부 의존성은 mock

단위 테스트에서는 DB, Discord API 등 외부 의존성을 mock으로 대체한다.

```typescript
// Repository를 mock으로 주입
const mockRepo = {
  createSession: jest.fn(),
  endSession: jest.fn(),
};

const module = await Test.createTestingModule({
  providers: [
    StudyService,
    { provide: STUDY_SESSION_REPOSITORY, useValue: mockRepo },
  ],
}).compile();
```

### 4. E2E 테스트 주의사항

- 테스트용 데이터는 식별 가능한 ID 사용 (예: `__test_user_e2e_999999__`)
- `afterEach`/`afterAll`에서 테스트 데이터 반드시 정리
- `.env`에 Supabase 키가 설정되어 있어야 실행 가능

## 환경변수

| 변수 | 필요한 테스트 | 설명 |
|------|-------------|------|
| `DB_TYPE` | test:supabase | `supabase`로 자동 설정됨 |
| `SUPABASE_URL` | test:supabase | Supabase 프로젝트 URL |
| `SUPABASE_ANON_KEY` | test:supabase | Supabase publishable key |
