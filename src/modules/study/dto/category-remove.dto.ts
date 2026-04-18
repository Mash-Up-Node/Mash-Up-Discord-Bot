import { CategoryChannel, ChannelType } from 'discord.js';
import { ChannelOption } from 'necord';

export class CategoryRemoveDto {
  @ChannelOption({
    name: 'category',
    description: '삭제할 카테고리',
    channel_types: [ChannelType.GuildCategory],
    required: true,
  })
  category!: CategoryChannel;
}
