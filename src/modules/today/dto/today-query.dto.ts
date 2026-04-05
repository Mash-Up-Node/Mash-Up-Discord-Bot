import { StringOption } from 'necord';

export class TodayQueryDto {
  @StringOption({
    name: '지역',
    description: '조회할 지역명 (미지정 시 서울)',
    required: false,
  })
  location?: string;

  @StringOption({
    name: '운세',
    description: '형식: 남자,2025-05-18',
    required: false,
  })
  fortune?: string;
}
