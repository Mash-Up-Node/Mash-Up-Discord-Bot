export interface TodaySummary {
  locationName: string;
  timezone: string;
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  isDay: boolean;
  windSpeed: number;
  pm10: number;
  pm2_5: number;
  europeanAqi: number;
}
