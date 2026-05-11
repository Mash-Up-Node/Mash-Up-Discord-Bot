import { StringOption } from 'necord';
import { FortuneGenderInput } from './today-fortune-query.dto';

export class FortuneSubscribeDto {
  @StringOption({
    name: '성별',
    description: '본인의 성별을 선택해주세요',
    required: true,
    choices: [
      { name: '남자', value: 'male' },
      { name: '여자', value: 'female' },
    ],
  })
  gender!: FortuneGenderInput;

  @StringOption({
    name: '생년월일',
    description: 'YYYY-MM-DD 형식으로 입력 (예: 1995-05-18)',
    required: true,
  })
  birthDate!: string;
}
