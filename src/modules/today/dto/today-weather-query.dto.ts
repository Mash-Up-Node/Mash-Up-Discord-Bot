import { StringOption } from 'necord';

export class TodayWeatherQueryDto {
  @StringOption({
    name: '지역',
    description: '조회할 지역명 (미지정 시 서울)',
    required: false,
  })
  location?: string;
}
