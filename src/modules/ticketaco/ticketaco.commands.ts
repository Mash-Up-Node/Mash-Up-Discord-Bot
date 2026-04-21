import { Injectable, Logger } from '@nestjs/common';
import { Context, Options, SlashCommand, SlashCommandContext } from 'necord';
import { TicketacoService } from './ticketaco.service';
import { buildTicketacoListEmbed } from './ticketaco.embeds';
import { TicketacoSubscriptionDto } from './dto/ticketaco-subscription.dto';

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

  @SlashCommand({
    name: '이벤트-구독',
    description: '현재 채널에 새로운 Ticketaco 조직의 이벤트를 구독합니다.',
  })
  async onSubscribe(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: TicketacoSubscriptionDto,
  ): Promise<void> {
    await interaction.deferReply();

    if (!dto.slug.trim()) {
      await interaction.editReply({ content: 'slug를 입력해주세요.' });
      return;
    }

    try {
      const result = await this.ticketacoService.subscribeOrganization(
        dto.slug,
        interaction.channelId,
      );

      await interaction.editReply({
        content: result.created
          ? `✅ 현재 채널에 ${result.organizationName}(${result.slug}) 이벤트 구독을 추가했습니다.`
          : `ℹ️ 현재 채널은 이미 ${result.organizationName}(${result.slug})을 구독 중입니다.`,
      });
    } catch (error) {
      this.logger.error('Failed to subscribe ticketaco organization', error);
      await interaction.editReply({
        content: '이벤트 구독을 추가하는 중 오류가 발생했습니다.',
      });
    }
  }
}
