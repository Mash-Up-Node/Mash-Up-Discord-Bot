import { NumberOption } from 'necord';

export class SyncMembersDto {
  @NumberOption({
    name: 'generation',
    description: '기수 (예: 16)',
    required: true,
    min_value: 1,
  })
  generation!: number;
}
