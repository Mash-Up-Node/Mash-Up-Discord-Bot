import { Injectable } from '@nestjs/common';
import { CategoryChannel } from 'discord.js';
import { Context, Options, SlashCommand, SlashCommandContext } from 'necord';
import { StudyService } from './study.service';
import { CategoryService } from './category.service';
import { StudyTimeDto } from './dto/study-time.dto';
import { LeaderboardDto } from './dto/leaderboard.dto';
import {
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
  LEADERBOARD_LIMIT,
} from './study.constants';

function formatDuration(totalSeconds: number): string {
  if (totalSeconds === 0) return '0초';

  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor(
    (totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE,
  );
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}시간`);
  if (minutes > 0) parts.push(`${minutes}분`);
  if (seconds > 0) parts.push(`${seconds}초`);

  return parts.join(' ');
}

@Injectable()
export class StudyCommands {
  constructor(
    private readonly studyService: StudyService,
    private readonly categoryService: CategoryService,
  ) {}

  @SlashCommand({
    name: '공부시간',
    description:
      '누적 공부 시간을 확인합니다. 다른 사람이나 특정 카테고리를 지정할 수도 있습니다.',
  })
  async onStudyTime(
    @Context() [interaction]: SlashCommandContext,

    @Options() dto: StudyTimeDto,
  ): Promise<void> {
    const targetUser = dto.user ?? interaction.user;
    const category = dto.category;

    if (category && !this.categoryService.has(category.id)) {
      await interaction.reply({
        content: `${category.name}은 등록되지 않은 카테고리입니다.`,
      });
      return;
    }

    const totalSeconds = await this.studyService.getTotalDuration(
      targetUser.id,
      category?.id,
    );
    const scope = formatScope(category);

    if (totalSeconds === 0) {
      await interaction.reply({
        content: `${targetUser.displayName}님의 ${scope}공부 기록이 없습니다.`,
      });
      return;
    }

    await interaction.reply({
      content: `${targetUser.displayName}님의 ${scope}누적 공부 시간: ${formatDuration(totalSeconds)}`,
    });
  }

  @SlashCommand({
    name: '공부순위',
    description:
      '공부 시간 순위표를 확인합니다. 특정 카테고리를 지정할 수도 있습니다.',
  })
  async onLeaderboard(
    @Context() [interaction]: SlashCommandContext,

    @Options() dto: LeaderboardDto,
  ): Promise<void> {
    const category = dto.category;

    if (category && !this.categoryService.has(category.id)) {
      await interaction.reply({
        content: `${category.name}은 등록되지 않은 카테고리입니다.`,
      });
      return;
    }

    const leaderboard = await this.studyService.getLeaderboard(
      LEADERBOARD_LIMIT,
      category?.id,
    );
    const scope = formatScope(category);

    if (leaderboard.length === 0) {
      await interaction.reply({
        content: `아직 ${scope}공부 기록이 없습니다.`,
      });
      return;
    }

    const guild = interaction.guild;
    const lines = await Promise.all(
      leaderboard.map(async (entry, index) => {
        const member = guild
          ? await guild.members.fetch(entry.userId).catch(() => null)
          : null;
        const name = member?.displayName ?? `<@${entry.userId}>`;
        return `${index + 1}. ${name} — ${formatDuration(entry.total)}`;
      }),
    );

    const title = category
      ? `**${category.name} 공부 시간 순위표**`
      : '**공부 시간 순위표**';

    await interaction.reply({
      content: `${title}\n${lines.join('\n')}`,
    });
  }

  @SlashCommand({
    name: '팀공부순위',
    description:
      '현재 채널이 속한 팀(카테고리)의 공부 시간 순위를 조회합니다.',
  })
  async onTeamLeaderboard(
    @Context() [interaction]: SlashCommandContext,
  ): Promise<void> {
    const channel = interaction.channel;
    const parentId =
      channel && 'parentId' in channel ? channel.parentId : null;

    if (!parentId) {
      await interaction.reply({
        content:
          '팀 카테고리 내 채널에서 사용해주세요.',
      });
      return;
    }

    if (!this.categoryService.has(parentId)) {
      await interaction.reply({
        content: '이 카테고리는 등록된 공부 카테고리가 아닙니다.',
      });
      return;
    }

    const leaderboard = await this.studyService.getLeaderboard(
      LEADERBOARD_LIMIT,
      parentId,
    );

    if (leaderboard.length === 0) {
      await interaction.reply({
        content: '아직 이 카테고리의 공부 기록이 없습니다.',
      });
      return;
    }

    const guild = interaction.guild;
    const lines = await Promise.all(
      leaderboard.map(async (entry, index) => {
        const member = guild
          ? await guild.members.fetch(entry.userId).catch(() => null)
          : null;
        const name = member?.displayName ?? `<@${entry.userId}>`;
        return `${index + 1}. ${name} — ${formatDuration(entry.total)}`;
      }),
    );

    const categoryName =
      channel && 'parent' in channel && channel.parent
        ? channel.parent.name
        : '팀';

    await interaction.reply({
      content: `**${categoryName} 공부 시간 순위표**\n${lines.join('\n')}`,
    });
  }
}

function formatScope(category?: CategoryChannel): string {
  return category ? `${category.name} ` : '';
}
