# 디스코드 봇 서버 기준 프로젝트 구조 제안서

## 전제

- 이 문서는 구조 개선 방향만 제안한다.
- 실제 코드 수정은 하지 않는다.
- 이 프로젝트는 일반 웹 서비스가 아니라 디스코드 봇 서버로만 사용한다.
- 그래서 확장성은 고려하되, 과한 계층 분리나 선제적 폴더 증설은 피한다.

## 결론

현재 프로젝트 기준으로는 아래 3가지만 우선 반영하는 구조가 가장 적당하다.

- `config` 폴더를 두고 환경변수 관리 일원화
- 공유 가능한 `database` 계층 분리
- 복잡한 모듈에만 `domain` 도입

반대로 아래는 지금 시점에서는 과하다.

- `global`을 세부 하위 폴더까지 크게 나누는 것
- `infrastructure/discord` 같은 전용 인프라 레이어를 미리 만드는 것
- 모든 모듈에 `mappers`, `policies`, `value-objects`, `services` 폴더를 강제하는 것
- 단순한 `ping` 모듈까지 복잡한 계층 구조로 맞추는 것

## 추천 디렉토리 구조

```text
src/
  main.ts
  app.module.ts

  config/
    env.schema.ts
    env.types.ts
    configuration.ts
    index.ts

  global/
    constants/
    errors/
    utils/

  database/
    database.module.ts
    database.constants.ts
    sqlite.client.ts

  modules/
    ping/
      ping.module.ts
      ping.commands.ts

    study/
      study.module.ts
      study.service.ts
      study.commands.ts
      study.listener.ts
      repositories/
        sqlite-study-session.repository.ts
      domain/
        entities/
          study-session.entity.ts
        repositories/
          study-session.repository.ts
      dto/
      __tests__/

    today/
      today.module.ts
      today.service.ts
      today.commands.ts
      clients/
        today-weather.client.ts
        today-fortune.client.ts
      domain/
        entities/
          today-summary.entity.ts
      dto/
      utils/
      __tests__/
```

## 왜 이 정도가 적당한가

### 1. `config`는 반드시 필요

이건 과한 구조가 아니라 필수 구조다.

- 환경변수 기본값
- 환경변수 검증
- 타입 정리
- 설정 접근 일원화

현재처럼 `ConfigService.getOrThrow('DISCORD_TOKEN')`를 여기저기 직접 쓰기 시작하면, 나중에 관리 포인트가 흩어진다. 봇 서버여도 `config`는 따로 두는 게 맞다.

## 2. `database`는 도메인 밖으로 올리는 게 맞음

현재 `study.module.ts` 안에서 DB를 직접 만들고 있는데, 이건 모듈이 DB 생성 책임까지 같이 가지는 구조다.

디스코드 봇 서버라고 해도 아래 이유 때문에 분리하는 편이 낫다.

- 여러 모듈이 같은 DB를 공유할 수 있음
- DB 파일 경로를 환경변수와 연결하기 쉬움
- 테스트에서 DB 대체가 쉬워짐
- 저장소 구현과 DB 생성 책임이 분리됨

다만 `database`를 `infrastructure/database/sqlite/...` 식으로 너무 깊게 만들 필요는 아직 없다. 지금은 `src/database` 수준이면 충분하다.

## 3. `domain`은 복잡한 모듈에만 적용

`domain` 분리는 좋은 방향이지만, 모든 모듈에 일괄 적용하면 과해진다.

적용 대상:

- `study`
- `today`

유지 대상:

- `ping`은 지금처럼 단순하게 유지

즉, 복잡한 모듈만 `domain`을 두고, 단순 모듈은 기존 방식 유지가 현실적이다.

## 폴더별 기준

### `config`

역할:

- `.env` 읽기
- 기본값 정의
- 검증
- 타입 제공

추천 파일:

- `env.schema.ts`
- `env.types.ts`
- `configuration.ts`
- `index.ts`

### `global`

`global`은 최소한으로만 둔다.

넣어도 되는 것:

- 공통 상수
- 공통 에러
- 범용 유틸

지금은 `types`, `interfaces`까지 세분화할 필요는 낮다. 필요해질 때 추가하면 된다.

### `database`

역할:

- DB 연결 생성
- 공용 provider 제공
- DB 관련 토큰 관리

여기에는 비즈니스 규칙이 아니라 기술적 연결 책임만 둔다.

### `modules/<module>/domain`

역할:

- 핵심 엔티티
- 저장소 계약
- 도메인 규칙

여기에는 DB 생성, 외부 API 호출, Nest 모듈 조립을 넣지 않는다.

### `modules/<module>` 상위 레이어

역할:

- command
- listener
- service
- repository 구현체
- 외부 API client

즉, 실제 실행 흐름과 기술 구현은 여기서 담당한다.

## 모듈별 판단

### `study`

`study`는 상태 관리와 저장소가 있으니 `domain` 분리가 적당하다.

- `domain/repositories`: 저장소 인터페이스
- `repositories`: SQLite 구현체
- `study.service.ts`: 유스케이스 조합

이 구조는 과하지 않다.

### `today`

`today`는 외부 API 호출이 섞여 있으니 `clients` 분리가 유효하다.

- `domain`: 응답 모델
- `clients`: 외부 API 호출
- `today.service.ts`: 조합과 예외 처리

여기까지면 충분하다. `value-objects`, `policies` 같은 세부 폴더는 아직 필요 없다.

### `ping`

`ping`은 단순 명령 모듈이라 현재 구조 유지가 맞다.

`domain`이나 별도 레이어를 넣으면 오히려 구조만 무거워진다.

## 추천하지 않는 구조

지금 단계에서 아래는 보류하는 것이 좋다.

- `infrastructure/discord`
- `application/` 레이어 별도 분리
- 모든 모듈의 동일한 폴더 템플릿 강제
- `global/types`, `global/interfaces` 선제 생성
- `mappers`, `policies`, `value-objects` 폴더 선제 생성

이런 구조는 나중에 기능이 더 많아졌을 때 필요할 수는 있지만, 현재 봇 서버 규모에서는 관리 비용이 더 커질 가능성이 높다.

## 최종 제안

디스코드 봇 서버 전용이라면 다음 정도가 적정선이다.

1. `config`는 반드시 둔다.
2. DB는 `study` 모듈 밖으로 올려 공유 가능하게 한다.
3. `domain`은 `study`, `today` 같은 복잡한 모듈에만 둔다.
4. `ping` 같은 단순 모듈은 기존 구조를 유지한다.
5. 공통 폴더는 최소한으로만 두고, 필요할 때 확장한다.

즉, 방향은 "깔끔한 분리"가 맞지만, "미리 전부 쪼개두기"는 하지 않는 것이 이 프로젝트에는 더 적절하다.
