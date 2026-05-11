import { Injectable, Logger } from '@nestjs/common';
import { Context, Options, SlashCommand, SlashCommandContext } from 'necord';
import { isUnknownInteractionError } from '../../common/discord/interaction-response.util';
import { FortuneSubscribeDto } from './dto/fortune-subscription.dto';
import { FortuneSubscriptionService } from './services/fortune-subscription.service';

@Injectable()
export class FortuneSubscriptionCommands {
  private readonly logger = new Logger(FortuneSubscriptionCommands.name);

  constructor(
    private readonly subscriptionService: FortuneSubscriptionService,
  ) {}

  @SlashCommand({
    name: '운세구독',
    description: '매일 오전 8시에 오늘의 운세를 DM으로 받습니다.',
  })
  async onSubscribe(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: FortuneSubscribeDto,
  ): Promise<void> {
    try {
      await this.subscriptionService.subscribe(
        interaction.user.id,
        dto.gender,
        dto.birthDate,
      );
      await interaction.reply({
        content: `운세 구독이 완료되었어요. 매일 오전 8시에 DM으로 보내드릴게요.\n· 성별: ${dto.gender === 'male' ? '남자' : '여자'}\n· 생년월일: ${dto.birthDate}\n\n구독을 끄려면 \`/운세구독해제\`를 사용하세요.`,
        ephemeral: true,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '운세 구독에 실패했어요. 잠시 후 다시 시도해주세요.';
      this.logger.warn(`subscribe failed for ${interaction.user.id}: ${message}`);
      try {
        await interaction.reply({ content: message, ephemeral: true });
      } catch (replyError) {
        if (!isUnknownInteractionError(replyError)) {
          throw replyError;
        }
      }
    }
  }

  @SlashCommand({
    name: '운세구독해제',
    description: '운세 DM 구독을 해제합니다.',
  })
  async onUnsubscribe(
    @Context() [interaction]: SlashCommandContext,
  ): Promise<void> {
    const removed = await this.subscriptionService.unsubscribe(
      interaction.user.id,
    );
    await interaction.reply({
      content: removed
        ? '운세 구독을 해제했어요.'
        : '구독 중인 운세가 없어요.',
      ephemeral: true,
    });
  }
}
