import { CategoryChannel, ChannelType } from 'discord.js';
import { ChannelOption } from 'necord';

export class LeaderboardDto {
  @ChannelOption({
    name: 'category',
    description: '특정 카테고리만 조회 (미지정 시 전체)',
    channel_types: [ChannelType.GuildCategory],
    required: false,
  })
  category?: CategoryChannel;
}
