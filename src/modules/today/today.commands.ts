import { Injectable } from '@nestjs/common';
import { Context, Options, SlashCommand, SlashCommandContext } from 'necord';
import {
  isUnknownInteractionError,
  safeEditReply,
  safeReply,
} from '../../common/discord/interaction-response.util';
import { DEFAULT_LOCATION } from './constants/today.constants';
import { TODAY_COMMAND_FAILED } from './constants/today.messages';
import { TodayFortuneQueryDto } from './dto/today-fortune-query.dto';
import { TodayWeatherQueryDto } from './dto/today-weather-query.dto';
import { formatTodayFortune } from './formatters/today-fortune-message.formatter';
import { formatTodaySummary } from './formatters/today-weather-message.formatter';
import { TodayFortuneService } from './services/today-fortune.service';
import { TodayWeatherService } from './services/today-weather.service';

@Injectable()
export class TodayCommands {
  constructor(
    private readonly weatherService: TodayWeatherService,
    private readonly fortuneService: TodayFortuneService,
  ) {}

  @SlashCommand({
    name: '오늘날씨',
    description: '오늘의 날씨와 미세먼지를 조회합니다.',
  })
  async onTodayWeather(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: TodayWeatherQueryDto,
  ): Promise<void> {
    await this.handleDeferredReply(interaction, async () => {
      const location = dto.location?.trim() || DEFAULT_LOCATION;
      const summary = await this.weatherService.getTodaySummary(location);
      return formatTodaySummary(summary);
    });
  }

  @SlashCommand({
    name: '오늘운세',
    description: '오늘의 운세를 조회합니다.',
  })
  async onTodayFortune(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: TodayFortuneQueryDto,
  ): Promise<void> {
    await this.handleDeferredReply(interaction, async () => {
      const fortune = await this.fortuneService.getTodayFortune(
        dto.gender,
        dto.birthDate,
      );
      return formatTodayFortune(fortune);
    });
  }

  @SlashCommand({
    name: '내일운세',
    description: '내일의 운세를 조회합니다.',
  })
  async onTomorrowFortune(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: TodayFortuneQueryDto,
  ): Promise<void> {
    await this.handleDeferredReply(interaction, async () => {
      const fortune = await this.fortuneService.getTomorrowFortune(
        dto.gender,
        dto.birthDate,
      );
      return formatTodayFortune(fortune, '내일의 운세');
    });
  }

  private async handleDeferredReply(
    interaction: SlashCommandContext[0],
    resolver: () => Promise<string>,
  ): Promise<void> {
    let hasDeferred = false;

    try {
      // 외부 API 호출이 있어 Discord 응답 제한 시간을 넘길 수 있으므로 먼저 defer한다.
      await interaction.deferReply();
      hasDeferred = true;

      const content = await resolver();
      await interaction.editReply({ content });
    } catch (error) {
      // 이미 만료된 interaction이면 추가 응답 시도도 실패하므로 그대로 종료한다.
      if (isUnknownInteractionError(error)) {
        return;
      }

      const message =
        error instanceof Error ? error.message : TODAY_COMMAND_FAILED;

      // defer 이후에는 editReply, 아니면 reply로 응답한다.
      if (hasDeferred) {
        await safeEditReply(interaction, message);
        return;
      }

      await safeReply(interaction, message);
    }
  }
}
