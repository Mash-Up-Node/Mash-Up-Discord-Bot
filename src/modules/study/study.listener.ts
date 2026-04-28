import { Injectable } from '@nestjs/common';
import { Context, On } from 'necord';
import { VoiceState } from 'discord.js';
import { StudyService } from './study.service';
import { CategoryService } from './category.service';
import { UserService } from '../user/user.service';

@Injectable()
export class StudyListener {
  constructor(
    private readonly studyService: StudyService,
    private readonly categoryService: CategoryService,
    private readonly userService: UserService,
  ) {}

  private isInStudyCategory(state: VoiceState): boolean {
    const parentId = state.channel?.parentId;
    return parentId != null && this.categoryService.has(parentId);
  }

  @On('voiceStateUpdate')
  async onVoiceStateUpdate(
    @Context() [oldState, newState]: [VoiceState, VoiceState],
  ): Promise<void> {
    const member = newState.member ?? oldState.member;
    if (!member) return;
    const userId = member.id;

    const wasInCategory = this.isInStudyCategory(oldState);
    const isInCategory = this.isInStudyCategory(newState);

    // 카테고리 밖 → 카테고리 밖: 무시
    if (!wasInCategory && !isInCategory) return;

    // 입장: 카테고리 밖 → 카테고리 안
    if (!wasInCategory && isInCategory) {
      await this.userService.ensureUser(userId, member.displayName);
      await this.studyService.handleJoin(
        userId,
        newState.channelId!,
        newState.channel!.parentId!,
      );
      return;
    }

    // 퇴장: 카테고리 안 → 카테고리 밖 (또는 연결 해제)
    if (wasInCategory && !isInCategory) {
      await this.studyService.handleLeave(userId);
      return;
    }

    // 카테고리 내 채널 이동
    if (oldState.channelId !== newState.channelId) {
      await this.userService.ensureUser(userId, member.displayName);
      await this.studyService.handleMove(
        userId,
        newState.channelId!,
        newState.channel!.parentId!,
      );
    }
  }
}
