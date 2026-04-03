import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, SlashCommandContext } from 'necord';
import { StudyService } from './study.service';

@Injectable()
export class StudyCommands {
  constructor(private readonly studyService: StudyService) {}

  @SlashCommand({
    name: '공부시간',
    description: '내 누적 공부 시간을 확인합니다.',
  })
  async onStudyTime(
    @Context() [interaction]: SlashCommandContext,
  ): Promise<void> {
    const userId = interaction.user.id;
    const totalSeconds = await this.studyService.getTotalDuration(userId);

    if (totalSeconds === 0) {
      await interaction.reply({ content: '아직 공부 기록이 없습니다.' });
      return;
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}시간`);
    if (minutes > 0) parts.push(`${minutes}분`);
    if (seconds > 0) parts.push(`${seconds}초`);

    await interaction.reply({
      content: `누적 공부 시간: ${parts.join(' ')}`,
    });
  }
}
