import { Injectable } from '@nestjs/common';
import { Context, Options, SlashCommand, SlashCommandContext } from 'necord';
import { TodayQueryDto } from './dto/today-query.dto';
import { TodayService } from './today.service';
import {
  formatTodayFortune,
  formatTodaySummary,
} from './utils/today-formatters';

const DEFAULT_LOCATION = '서울';

@Injectable()
export class TodayCommands {
  constructor(private readonly todayService: TodayService) {}

  @SlashCommand({
    name: '오늘',
    description: '오늘의 날씨와 미세먼지를 조회합니다.',
  })
  async onToday(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: TodayQueryDto,
  ): Promise<void> {
    try {
      if (dto.tomorrowFortune?.trim()) {
        const fortune = await this.todayService.getTomorrowFortune(
          dto.tomorrowFortune,
        );
        await interaction.reply({
          content: formatTodayFortune(fortune, '내일의 운세'),
        });
        return;
      }

      if (dto.fortune?.trim()) {
        const fortune = await this.todayService.getTodayFortune(dto.fortune);
        await interaction.reply({ content: formatTodayFortune(fortune) });
        return;
      }

      const location = dto.location?.trim() || DEFAULT_LOCATION;
      const summary = await this.todayService.getTodaySummary(location);
      await interaction.reply({ content: formatTodaySummary(summary) });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '오늘 정보를 가져오지 못했습니다.';

      await interaction.reply({ content: message });
    }
  }
}
