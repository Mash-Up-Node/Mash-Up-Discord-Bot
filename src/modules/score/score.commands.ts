import { Injectable, UseGuards } from '@nestjs/common';
import { Context, SlashCommand, SlashCommandContext } from 'necord';
import { ScoreService } from './score.service';
import { AdminGuard } from '../user/admin.guard';

@Injectable()
export class ScoreCommands {
  constructor(private readonly scoreService: ScoreService) {}

  @SlashCommand({
    name: 'my-score',
    description: '내 점수와 소속 팀을 확인합니다.',
  })
  async onMyScore(
    @Context() [interaction]: SlashCommandContext,
  ): Promise<void> {
    const user = await this.scoreService.getMyScore(interaction.user.id);

    if (!user) {
      await interaction.reply({
        content: '등록되지 않은 유저입니다. 관리자에게 동기화를 요청해주세요.',
        ephemeral: true,
      });
      return;
    }

    const teamName = user.team?.name ?? '미배정';
    await interaction.reply({
      content: `**${user.nickname}** (${user.department}, ${user.generation}기)\n점수: ${user.score}점\n팀: ${teamName}`,
      ephemeral: true,
    });
  }

  @SlashCommand({
    name: 'score-rank',
    description: '팀별 합산 점수 랭킹을 확인합니다.',
  })
  async onScoreRank(
    @Context() [interaction]: SlashCommandContext,
  ): Promise<void> {
    const ranking = await this.scoreService.getTeamRanking();

    if (ranking.length === 0) {
      await interaction.reply({ content: '아직 점수 기록이 없습니다.' });
      return;
    }

    const lines = ranking.map(
      (entry, i) => `${i + 1}. ${entry.teamName} — ${entry.totalScore}점`,
    );

    await interaction.reply({
      content: `**팀 점수 랭킹**\n${lines.join('\n')}`,
    });
  }

  @UseGuards(AdminGuard)
  @SlashCommand({
    name: '시즌-종료',
    description: '시즌을 종료하고 모든 점수와 팀을 초기화합니다. (관리자 전용)',
  })
  async onSeasonEnd(
    @Context() [interaction]: SlashCommandContext,
  ): Promise<void> {
    await this.scoreService.resetAll();
    await interaction.reply({
      content: '시즌이 종료되었습니다. 모든 점수와 팀이 초기화되었습니다.',
    });
  }
}
