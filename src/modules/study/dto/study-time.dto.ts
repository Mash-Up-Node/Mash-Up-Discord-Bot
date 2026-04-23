import { CategoryChannel, ChannelType, User } from 'discord.js';
import { ChannelOption, UserOption } from 'necord';

export class StudyTimeDto {
  @UserOption({
    name: 'user',
    description: '확인할 사용자 (미지정 시 본인)',
    required: false,
  })
  user?: User;

  @ChannelOption({
    name: 'category',
    description: '특정 카테고리만 조회 (미지정 시 전체)',
    channel_types: [ChannelType.GuildCategory],
    required: false,
  })
  category?: CategoryChannel;
}
