# 오늘 정보 모듈

현재 날씨와 미세먼지 정보를 조회하는 기능입니다.

## 슬래시 커맨드

### `/오늘`

현재 날씨와 대기질을 조회합니다.

- **옵션**: `지역` (선택) - 미지정 시 `서울`
- **옵션**: `운세` (선택) - 형식 `남자,2025-05-18`
- **옵션**: `내일운세` (선택) - 형식 `남자,2025-05-18`
- **예시 응답**:
  ```
  서울특별시, 대한민국
  현재 날씨: 맑음
  기온 17.2°C · 체감 16.4°C · 바람 11.3km/h

  공기질: 양호 (AQI 32)
  미세먼지: 좋음 (PM10 28.5μg/m³)
  초미세먼지: 좋음 (PM2.5 14.2μg/m³)

  한줄 팁: 대체로 무난하지만 민감하면 마스크를 챙기세요.
  시간대: Asia/Seoul
  ```

- **운세 예시 응답**:
  ```
  오늘의 운세
  입력: 남자 / 2025-05-18
  총운 키워드: 일석삼조
  기준일: 2026.04.05
  총운: 좋은 일이 겹쳐 들어오는 날입니다.
  ```

- **내일운세 예시 응답**:
  ```
  내일의 운세
  입력: 남자 / 2025-05-18
  총운 키워드: 순망치한
  기준일: 2026.04.06
  총운: 말과 행동이 일치하도록 노력할 필요가 있는 날입니다.
  ```

## 동작 방식

DB를 사용하지 않고 요청 시점마다 외부 API를 호출합니다.

1. Open-Meteo Geocoding API로 지역명을 좌표로 변환
2. Open-Meteo Forecast API로 현재 날씨 조회
3. Open-Meteo Air Quality API로 현재 미세먼지 조회
4. `운세` 또는 `내일운세` 옵션이 있으면 네이버 비공식 JSONP 응답을 파싱해 총운 조회
5. 외부 API 호출 시간이 길어질 수 있어 Discord interaction은 먼저 `deferReply()`로 연장한 뒤 `editReply()`로 최종 응답

### `deferReply()`를 쓰는 이유

Discord 슬래시 커맨드는 초기에 짧은 시간 안에 응답하지 않으면 interaction이 만료됩니다.
`today` 모듈은 날씨, 대기질, 운세 조회를 위해 외부 API를 호출하므로 응답이 3초를 넘길 수 있습니다.
이 경우 바로 `reply()`만 사용하면 `DiscordAPIError[10062]: Unknown interaction`가 발생할 수 있으므로,
먼저 `deferReply()`로 응답 시간을 확보하고 조회가 끝난 뒤 `editReply()`로 최종 메시지를 보냅니다.

## 모듈 구조

```text
src/modules/today/
├── today.module.ts
├── today.commands.ts
├── today.service.ts
├── constants/
│   ├── air-quality.constants.ts
│   ├── today.constants.ts
│   ├── today.locations.ts
│   ├── today.messages.ts
│   └── weather-codes.ts
├── dto/
│   └── today-query.dto.ts
├── interfaces/
│   └── today-api.interface.ts
├── types/
│   ├── today-fortune.type.ts
│   └── today-summary.type.ts
├── utils/
│   ├── fortune-input.util.ts
│   ├── location-name.util.ts
│   ├── naver-fortune.util.ts
│   ├── naver-jsonp.util.ts
│   ├── today-formatters.ts
│   └── weather-summary.util.ts
└── __tests__/
    ├── today-formatters.spec.ts
    ├── today.commands.spec.ts
    └── today.service.spec.ts
```
