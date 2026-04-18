import { formatTodaySummary } from '../formatters/today-weather-message.formatter';

describe('formatTodaySummary', () => {
  it('공기질 등급과 생활 팁을 함께 보여준다', () => {
    const content = formatTodaySummary(
      {
        locationName: '서울특별시, 대한민국',
        timezone: 'Asia/Seoul',
        temperature: 17.2,
        apparentTemperature: 16.4,
        weatherCode: 0,
        isDay: true,
        windSpeed: 11.3,
        pm10: 28.5,
        pm2_5: 14.2,
        europeanAqi: 32,
      },
      () => 0,
    );

    expect(content).toContain('공기질: 양호 (AQI 32)');
    expect(content).toContain('미세먼지: 좋음 (PM10 28.5μg/m³)');
    expect(content).toContain('초미세먼지: 좋음 (PM2.5 14.2μg/m³)');
    expect(content).toContain(
      '한줄 팁: 대체로 무난하지만 민감하면 마스크를 챙기세요.',
    );
  });

  it('비가 오고 공기질이 나쁘면 우산과 마스크 안내를 같이 보여준다', () => {
    const content = formatTodaySummary(
      {
        locationName: '부산광역시, 대한민국',
        timezone: 'Asia/Seoul',
        temperature: 21,
        apparentTemperature: 20,
        weatherCode: 63,
        isDay: true,
        windSpeed: 13,
        pm10: 70,
        pm2_5: 40,
        europeanAqi: 85,
      },
      () => 0,
    );

    expect(content).toContain('공기질: 매우 나쁨 (AQI 85)');
    expect(content).toContain('미세먼지: 보통 (PM10 70μg/m³)');
    expect(content).toContain('초미세먼지: 나쁨 (PM2.5 40μg/m³)');
    expect(content).toContain('마스크가 사실상 필수예요.');
    expect(content).toContain('우산 챙기세요.');
  });
});
