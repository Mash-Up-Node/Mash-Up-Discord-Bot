import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Context, On } from 'necord';
import { VoiceState } from 'discord.js';
import { StudyService } from './study.service';

@Injectable()
export class StudyListener {
  private readonly categoryId: string;

  constructor(
    private readonly studyService: StudyService,
    private readonly configService: ConfigService,
  ) {
    this.categoryId =
      this.configService.getOrThrow<string>('STUDY_CATEGORY_ID');
  }

  private isInStudyCategory(state: VoiceState): boolean {
    return state.channel?.parentId === this.categoryId;
  }

  @On('voiceStateUpdate')
  async onVoiceStateUpdate(
    @Context() oldState: VoiceState,
    newState: VoiceState,
  ): Promise<void> {
    const userId = (newState.member ?? oldState.member)?.id;
    if (!userId) return;

    const wasInCategory = this.isInStudyCategory(oldState);
    const isInCategory = this.isInStudyCategory(newState);

    // 카테고리 밖 → 카테고리 밖: 무시
    if (!wasInCategory && !isInCategory) return;

    // 입장: 카테고리 밖 → 카테고리 안
    if (!wasInCategory && isInCategory) {
      await this.studyService.handleJoin(userId, newState.channelId!);
      return;
    }

    // 퇴장: 카테고리 안 → 카테고리 밖 (또는 연결 해제)
    if (wasInCategory && !isInCategory) {
      await this.studyService.handleLeave(userId);
      return;
    }

    // 카테고리 내 채널 이동
    if (oldState.channelId !== newState.channelId) {
      await this.studyService.handleMove(userId, newState.channelId!);
    }
  }
}
