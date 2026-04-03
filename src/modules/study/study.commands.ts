import { Injectable } from '@nestjs/common';
import { Context, Options, SlashCommand, SlashCommandContext } from 'necord';
import { StudyService } from './study.service';
import { StudyTimeDto } from './dto/study-time.dto';

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}시간`);
  if (minutes > 0) parts.push(`${minutes}분`);
  if (seconds > 0) parts.push(`${seconds}초`);

  return parts.join(' ');
}

@Injectable()
export class StudyCommands {
  constructor(private readonly studyService: StudyService) {}

  @SlashCommand({
    name: '공부시간',
    description:
      '누적 공부 시간을 확인합니다. 다른 사람을 지정할 수도 있습니다.',
  })
  async onStudyTime(
    @Context() [interaction]: SlashCommandContext,

    @Options() dto: StudyTimeDto,
  ): Promise<void> {
    const targetUser = dto.user ?? interaction.user;
    const totalSeconds = await this.studyService.getTotalDuration(
      targetUser.id,
    );

    if (totalSeconds === 0) {
      await interaction.reply({
        content: `${targetUser.displayName}님의 공부 기록이 없습니다.`,
      });
      return;
    }

    await interaction.reply({
      content: `${targetUser.displayName}님의 누적 공부 시간: ${formatDuration(totalSeconds)}`,
    });
  }

  @SlashCommand({
    name: '공부순위',
    description: '공부 시간 순위표를 확인합니다.',
  })
  async onLeaderboard(
    @Context() [interaction]: SlashCommandContext,
  ): Promise<void> {
    const leaderboard = await this.studyService.getLeaderboard(10);

    if (leaderboard.length === 0) {
      await interaction.reply({ content: '아직 공부 기록이 없습니다.' });
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

    await interaction.reply({
      content: `**공부 시간 순위표**\n${lines.join('\n')}`,
    });
  }
}
