# 오늘 정보 모듈

현재 날씨와 미세먼지 정보를 조회하는 기능입니다.

## 슬래시 커맨드

### `/오늘`

현재 날씨와 대기질을 조회합니다.

- **옵션**: `지역` (선택) - 미지정 시 `서울`
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

## 동작 방식

DB를 사용하지 않고 요청 시점마다 외부 API를 호출합니다.

1. Open-Meteo Geocoding API로 지역명을 좌표로 변환
2. Open-Meteo Forecast API로 현재 날씨 조회
3. Open-Meteo Air Quality API로 현재 미세먼지 조회

## 모듈 구조

```text
src/modules/today/
├── today.module.ts
├── today.commands.ts
├── today.service.ts
├── dto/
│   └── today-query.dto.ts
├── entities/
│   └── today-summary.entity.ts
└── __tests__/
    ├── today.commands.spec.ts
    └── today.service.spec.ts
```
