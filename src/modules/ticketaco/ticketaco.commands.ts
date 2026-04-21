import { Injectable, Logger } from '@nestjs/common';
import { Context, SlashCommand, SlashCommandContext } from 'necord';
import { TicketacoService } from './ticketaco.service';
import { buildTicketacoListEmbed } from './ticketaco.embeds';

@Injectable()
export class TicketacoCommands {
  private readonly logger = new Logger(TicketacoCommands.name);

  constructor(private readonly ticketacoService: TicketacoService) {}

  @SlashCommand({
    name: '이벤트',
    description: '구독 중인 조직의 예정된 이벤트를 확인합니다.',
  })
  async onEvents(@Context() [interaction]: SlashCommandContext): Promise<void> {
    await interaction.deferReply();

    try {
      const embeds = (await this.ticketacoService.getUpcomingEventEntries())
        .slice(0, 10)
        .map(({ orgName, event }) => buildTicketacoListEmbed(orgName, event));

      if (embeds.length === 0) {
        await interaction.editReply({ content: '예정된 이벤트가 없습니다.' });
        return;
      }

      await interaction.editReply({ embeds });
    } catch (error) {
      this.logger.error('Failed to load upcoming events', error);
      await interaction.editReply({
        content: '이벤트 정보를 불러오는 중 오류가 발생했습니다.',
        embeds: [],
      });
    }
  }
}
