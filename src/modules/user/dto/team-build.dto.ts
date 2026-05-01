import { StringOption } from 'necord';

export class TeamBuildDto {
  @StringOption({
    name: 'name',
    description: '팀명 (예: 1조)',
    required: true,
  })
  name!: string;

  @StringOption({
    name: 'members',
    description: '팀 멤버 멘션 (예: @홍길동 @김철수)',
    required: true,
  })
  members!: string;
}
