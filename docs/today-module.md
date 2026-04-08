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
  서울, 서울특별시, 대한민국 현재 정보
  날씨: 맑음
  기온: 17.2°C
  체감: 16.4°C
  풍속: 11.3km/h
  미세먼지(PM10): 28.5μg/m³
  초미세먼지(PM2.5): 14.2μg/m³
  대기질 지수(European AQI): 32
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

## 모듈 구조

```text
src/modules/today/
├── today.module.ts
├── today.commands.ts
├── today.service.ts
├── constants/
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
└── __tests__/
    ├── today.commands.spec.ts
    └── today.service.spec.ts
```
