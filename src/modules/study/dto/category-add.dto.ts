import { CategoryChannel, ChannelType } from 'discord.js';
import { ChannelOption } from 'necord';

export class CategoryAddDto {
  @ChannelOption({
    name: 'category',
    description: '추가할 카테고리',
    channel_types: [ChannelType.GuildCategory],
    required: true,
  })
  category!: CategoryChannel;
}
