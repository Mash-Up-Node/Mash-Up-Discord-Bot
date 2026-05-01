import { Injectable, Logger } from '@nestjs/common';
import { Context, Options, SlashCommand, SlashCommandContext } from 'necord';
import type { Channel } from 'discord.js';
import { SemantleCommandDto } from './dto/semantle-command.dto';
import {
  EmptySemantleGuessError,
  NotSemantleThreadError,
} from './semantle.error';
import { SemantleService } from './semantle.service';
import type { SemantleThreadParentChannel } from './semantle.type';

@Injectable()
export class SemantleCommands {
  private readonly logger = new Logger(SemantleCommands.name);

  constructor(private readonly semantleService: SemantleService) {}

  @SlashCommand({
    name: '꼬맨틀',
    description: '오늘의 꼬맨틀을 함께 즐겨보세요.',
  })
  async onSemantle(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: SemantleCommandDto,
  ) {
    await interaction.deferReply();

    const channel =
      interaction.channel ??
      (await interaction.client.channels
        .fetch(interaction.channelId)
        .catch(() => null));

    const word = dto.word?.trim();

    try {
      if (!channel) {
        const content = '현재 채널 정보를 확인하지 못했습니다.';
        return await interaction.editReply({ content });
      }

      // 단어 옵션이 없으면 꼬맨틀 스레드를 생성
      if (!word) {
        if (channel.isThread()) {
          const content = '스레드에서는 `/꼬맨틀 word:단어`처럼 추측해주세요.';
          return await interaction.editReply({ content });
        }

        if (!this.isSemantleThreadParentChannel(channel)) {
          const content = '꼬맨틀 스레드는 일반 채널에서만 만들 수 있습니다.';
          return await interaction.editReply({ content });
        }

        const result = await this.semantleService.openTodayThread(channel);
        const thread = result.thread.toString();
        const content = result.created
          ? `✅ 오늘의 꼬맨틀 스레드를 만들었어요: ${thread}`
          : `ℹ️ 오늘의 꼬맨틀 스레드가 이미 있어요: ${thread}`;

        return await interaction.editReply({ content });
      }

      // 단어 옵션이 있으면 추측을 제출
      if (word) {
        if (!channel.isThread()) {
          const content =
            '단어 추측은 꼬맨틀 스레드 안에서 `/꼬맨틀 word:단어`처럼 입력해주세요.';
          return await interaction.editReply({ content });
        }

        const { content } = await this.semantleService.submitGuessFromThread(
          channel,
          interaction.user.id,
          word,
        );
        return await interaction.editReply({ content });
      }
    } catch (error) {
      if (error instanceof EmptySemantleGuessError) {
        return await interaction.editReply({ content: error.message });
      }

      if (error instanceof NotSemantleThreadError) {
        const content =
          '이 스레드는 꼬맨틀 스레드가 아닙니다. `/꼬맨틀`로 꼬맨틀 스레드를 먼저 만들어주세요.';
        return await interaction.editReply({ content });
      }

      this.logger.error('Failed to handle semantle command', error);
      const content = '꼬맨틀 요청을 처리하는 중 오류가 발생했습니다.';
      return await interaction.editReply({ content });
    }
  }

  private isSemantleThreadParentChannel(
    channel: Channel,
  ): channel is SemantleThreadParentChannel {
    const maybeParent = channel as Partial<SemantleThreadParentChannel>;

    return (
      !channel.isThread() &&
      typeof maybeParent.threads?.create === 'function' &&
      typeof maybeParent.threads.fetchActive === 'function'
    );
  }
}
