import { StringOption } from 'necord';

export class TodayFortuneQueryDto {
  @StringOption({
    name: '입력',
    description: '형식: 남자,2025-05-18',
    required: true,
  })
  input!: string;
}
