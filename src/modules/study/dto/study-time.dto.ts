import { User } from 'discord.js';
import { UserOption } from 'necord';

export class StudyTimeDto {
  @UserOption({
    name: 'user',
    description: '확인할 사용자 (미지정 시 본인)',
    required: false,
  })
  user?: User;
}
