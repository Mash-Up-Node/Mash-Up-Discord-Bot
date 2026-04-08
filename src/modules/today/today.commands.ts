import { Injectable } from '@nestjs/common';
import { Context, Options, SlashCommand, SlashCommandContext } from 'necord';
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
  async onToday(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: TodayQueryDto,
  ): Promise<void> {
    let hasDeferred = false;

    try {
      await interaction.deferReply();
      hasDeferred = true;

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

      const location = dto.location?.trim() || DEFAULT_LOCATION;
      const summary = await this.todayService.getTodaySummary(location);
      await interaction.editReply({ content: formatTodaySummary(summary) });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : TODAY_COMMAND_FAILED;

      if (hasDeferred) {
        await interaction.editReply({ content: message });
        return;
      }

      await interaction.reply({ content: message });
    }
  }
}
