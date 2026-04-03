import { StudyListener } from '../study.listener';
import { StudyService } from '../study.service';
import { ConfigService } from '@nestjs/config';
import { VoiceState } from 'discord.js';

describe('StudyListener', () => {
  let listener: StudyListener;
  let mockService: Record<string, jest.Mock>;
  let mockConfig: Record<string, jest.Mock>;

  const CATEGORY_ID = 'category-123';

  function createMockVoiceState(
    overrides: Partial<{
      channelId: string | null;
      parentId: string | null;
      userId: string;
    }> = {},
  ): VoiceState {
    return {
      channelId: overrides.channelId ?? null,
      channel: overrides.channelId
        ? { parentId: overrides.parentId ?? CATEGORY_ID }
        : null,
      member: {
        id: overrides.userId ?? 'user-1',
      },
    } as unknown as VoiceState;
  }

  beforeEach(() => {
    mockService = {
      handleJoin: jest.fn(),
      handleLeave: jest.fn(),
      handleMove: jest.fn(),
      getTotalDuration: jest.fn(),
      getActiveSessionsAll: jest.fn(),
    };

    mockConfig = {
      getOrThrow: jest.fn().mockReturnValue(CATEGORY_ID),
    };

    listener = new StudyListener(
      mockService as unknown as StudyService,
      mockConfig as unknown as ConfigService,
    );
  });

  describe('onVoiceStateUpdate', () => {
    it('카테고리 음성채널에 입장하면 handleJoin을 호출한다', async () => {
      const oldState = createMockVoiceState({ channelId: null });
      const newState = createMockVoiceState({
        channelId: 'voice-1',
        parentId: CATEGORY_ID,
      });

      await listener.onVoiceStateUpdate(oldState, newState);

      expect(mockService.handleJoin).toHaveBeenCalledWith('user-1', 'voice-1');
    });

    it('카테고리 음성채널에서 퇴장하면 handleLeave를 호출한다', async () => {
      const oldState = createMockVoiceState({
        channelId: 'voice-1',
        parentId: CATEGORY_ID,
      });
      const newState = createMockVoiceState({ channelId: null });

      await listener.onVoiceStateUpdate(oldState, newState);

      expect(mockService.handleLeave).toHaveBeenCalledWith('user-1');
    });

    it('카테고리 내 다른 음성채널로 이동하면 handleMove를 호출한다', async () => {
      const oldState = createMockVoiceState({
        channelId: 'voice-1',
        parentId: CATEGORY_ID,
      });
      const newState = createMockVoiceState({
        channelId: 'voice-2',
        parentId: CATEGORY_ID,
      });

      await listener.onVoiceStateUpdate(oldState, newState);

      expect(mockService.handleMove).toHaveBeenCalledWith('user-1', 'voice-2');
    });

    it('카테고리 밖 음성채널 입장은 무시한다', async () => {
      const oldState = createMockVoiceState({ channelId: null });
      const newState = createMockVoiceState({
        channelId: 'voice-1',
        parentId: 'other-category',
      });

      await listener.onVoiceStateUpdate(oldState, newState);

      expect(mockService.handleJoin).not.toHaveBeenCalled();
    });

    it('카테고리에서 카테고리 밖으로 이동하면 handleLeave를 호출한다', async () => {
      const oldState = createMockVoiceState({
        channelId: 'voice-1',
        parentId: CATEGORY_ID,
      });
      const newState = createMockVoiceState({
        channelId: 'voice-other',
        parentId: 'other-category',
      });

      await listener.onVoiceStateUpdate(oldState, newState);

      expect(mockService.handleLeave).toHaveBeenCalledWith('user-1');
    });

    it('카테고리 밖에서 카테고리 안으로 이동하면 handleJoin을 호출한다', async () => {
      const oldState = createMockVoiceState({
        channelId: 'voice-other',
        parentId: 'other-category',
      });
      const newState = createMockVoiceState({
        channelId: 'voice-1',
        parentId: CATEGORY_ID,
      });

      await listener.onVoiceStateUpdate(oldState, newState);

      expect(mockService.handleJoin).toHaveBeenCalledWith('user-1', 'voice-1');
    });
  });
});
