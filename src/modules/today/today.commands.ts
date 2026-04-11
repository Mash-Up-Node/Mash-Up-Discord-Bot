import { Injectable } from '@nestjs/common';
import { Context, Options, SlashCommand, SlashCommandContext } from 'necord';
import {
  isUnknownInteractionError,
  safeEditReply,
  safeReply,
} from '../../common/discord/interaction-response.util';
import { DEFAULT_LOCATION } from './constants/today.constants';
import { TODAY_COMMAND_FAILED } from './constants/today.messages';
import { TodayQueryDto } from './dto/today-query.dto';
import { TodayService } from './today.service';
import {
  formatTodayFortune,
  formatTodaySummary,
} from './utils/today-formatters';

@Injectable()
export class TodayCommands {
  constructor(private readonly todayService: TodayService) {}

  @SlashCommand({
    name: '오늘',
    description: '오늘의 날씨, 미세먼지, 오늘/내일 운세를 조회합니다.',
  })
  // 옵션 우선순위에 따른 운세/날씨 분기 진입점
  async onToday(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: TodayQueryDto,
  ): Promise<void> {
    let hasDeferred = false;

    try {
      // 외부 API 호출 전 응답 지연
      await interaction.deferReply();
      hasDeferred = true;

      // 운세 옵션 동시 입력 시 내일 운세 우선
      if (dto.tomorrowFortune?.trim()) {
        const fortune = await this.todayService.getTomorrowFortune(
          dto.tomorrowFortune,
        );
        await interaction.editReply({
          content: formatTodayFortune(fortune, '내일의 운세'),
        });
        return;
      }

      if (dto.fortune?.trim()) {
        const fortune = await this.todayService.getTodayFortune(dto.fortune);
        await interaction.editReply({ content: formatTodayFortune(fortune) });
        return;
      }

      // 운세 옵션 미입력 시 기본 날씨 요약 경로
      const location = dto.location?.trim() || DEFAULT_LOCATION;
      const summary = await this.todayService.getTodaySummary(location);
      await interaction.editReply({ content: formatTodaySummary(summary) });
    } catch (error) {
      if (isUnknownInteractionError(error)) {
        return;
      }

      const message =
        error instanceof Error ? error.message : TODAY_COMMAND_FAILED;

      // defer 여부에 따른 응답 방식 분기
      if (hasDeferred) {
        await safeEditReply(interaction, message);
        return;
      }

      await safeReply(interaction, message);
    }
  }
}
