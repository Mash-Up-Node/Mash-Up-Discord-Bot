import type { AnyThreadChannel, TextChannel } from 'discord.js';
import { SemantleApiClient, SemantleApiError } from '../semantle-api.client';
import {
  EmptySemantleGuessError,
  NotSemantleThreadError,
} from '../semantle.error';
import { SemantleService } from '../semantle.service';

function createThreadCollection(threads: AnyThreadChannel[]) {
  return {
    find: (predicate: (thread: AnyThreadChannel) => boolean) =>
      threads.find(predicate),
  };
}

describe('SemantleService', () => {
  let service: SemantleService;
  let semantleApiClient: Record<string, jest.Mock>;

  const today = {
    answer_id: 1485,
    '1st_score': 0.5066384077072144,
    '10th_score': 0.45334914326667786,
    '1000th_score': 0.2307651787996292,
    previous: { answer_id: 1484, key: '놀랍다' },
  };

  beforeEach(() => {
    semantleApiClient = {
      fetchToday: jest.fn(),
      guess: jest.fn(),
    };
    service = new SemantleService(
      semantleApiClient as unknown as SemantleApiClient,
    );
  });

  describe('openTodayThread', () => {
    it('오늘 꼬맨틀 스레드가 없으면 새 스레드를 만들고 안내 메시지를 보낸다', async () => {
      const send = jest.fn();
      const createdThread = {
        name: '꼬맨틀 #1485',
        send,
      } as unknown as AnyThreadChannel;
      const fetchActive = jest.fn().mockResolvedValue({
        threads: createThreadCollection([]),
      });
      const createThread = jest.fn().mockResolvedValue(createdThread);
      const channel = {
        threads: {
          fetchActive,
          create: createThread,
        },
      } as unknown as TextChannel;
      semantleApiClient.fetchToday.mockResolvedValue(today);

      const result = await service.openTodayThread(channel);

      expect(fetchActive).toHaveBeenCalled();
      expect(createThread).toHaveBeenCalledWith(
        expect.objectContaining({ name: '꼬맨틀 #1485' }),
      );
      expect(send).toHaveBeenCalledWith({
        content: expect.stringContaining('# 꼬맨틀 #1485') as string,
      });
      expect(result).toEqual({ today, thread: createdThread, created: true });
    });

    it('오늘 꼬맨틀 스레드가 이미 있으면 기존 스레드를 재사용한다', async () => {
      const existingThreadSend = jest.fn();
      const existingThread = {
        name: '꼬맨틀 #1485',
        send: existingThreadSend,
      } as unknown as AnyThreadChannel;
      const createThread = jest.fn();
      const channel = {
        threads: {
          fetchActive: jest.fn().mockResolvedValue({
            threads: createThreadCollection([existingThread]),
          }),
          create: createThread,
        },
      } as unknown as TextChannel;
      semantleApiClient.fetchToday.mockResolvedValue(today);

      const result = await service.openTodayThread(channel);

      expect(createThread).not.toHaveBeenCalled();
      expect(existingThreadSend).not.toHaveBeenCalled();
      expect(result).toEqual({ today, thread: existingThread, created: false });
    });
  });

  describe('submitGuessFromThread', () => {
    it('스레드 이름의 answerId로 추측을 제출하고 응답 메시지를 만든다', async () => {
      const thread = { name: '꼬맨틀 #1485' } as AnyThreadChannel;
      semantleApiClient.guess.mockResolvedValue({
        guess: '사람',
        sim: 0.13175931572914124,
        rank: '1000위 이상',
      });

      const result = await service.submitGuessFromThread(
        thread,
        'user-1',
        ' 사람 ',
      );

      expect(semantleApiClient.guess).toHaveBeenCalledWith(1485, '사람');
      expect(result).toEqual({
        status: 'guessed',
        answerId: 1485,
        word: '사람',
        result: {
          guess: '사람',
          sim: 0.13175931572914124,
          rank: '1000위 이상',
        },
        content:
          '<@user-1> 님의 `사람`는 유사도 13.18 (유사도 순위 1000위 이상) 입니다.',
      });
    });

    it('정답이면 correct 상태와 정답 메시지를 반환한다', async () => {
      const thread = { name: '꼬맨틀 #1484' } as AnyThreadChannel;
      semantleApiClient.guess.mockResolvedValue({
        guess: '놀랍다',
        sim: 1,
        rank: '정답!',
      });

      const result = await service.submitGuessFromThread(
        thread,
        'user-1',
        '놀랍다',
      );

      expect(semantleApiClient.guess).toHaveBeenCalledWith(1484, '놀랍다');
      expect(result.status).toBe('correct');
      expect(result.content).toBe(
        '🎉 <@user-1> 님이 정답 `놀랍다`을(를) 맞혔습니다! 유사도 100.00 입니다. 그래도 계속 추측할 수 있어요.',
      );
    });

    it('알 수 없는 단어면 invalid_guess 상태를 반환한다', async () => {
      const thread = { name: '꼬맨틀 #1485' } as AnyThreadChannel;
      semantleApiClient.guess.mockRejectedValue(
        new SemantleApiError(404, 'guess', {
          type: 'InvalidGuess',
          description: '처리할 수 없는 입력입니다.',
        }),
      );

      const result = await service.submitGuessFromThread(
        thread,
        'user-1',
        '없는단어zzzzz',
      );

      expect(result).toEqual({
        status: 'invalid_guess',
        answerId: 1485,
        word: '없는단어zzzzz',
        content: '`없는단어zzzzz`은(는) 알 수 없는 단어입니다.',
      });
    });

    it('꼬맨틀 스레드가 아니면 에러를 던진다', async () => {
      const thread = { name: '잡담' } as AnyThreadChannel;

      await expect(
        service.submitGuessFromThread(thread, 'user-1', '사람'),
      ).rejects.toBeInstanceOf(NotSemantleThreadError);
    });

    it('빈 단어면 에러를 던진다', async () => {
      const thread = { name: '꼬맨틀 #1485' } as AnyThreadChannel;

      await expect(
        service.submitGuessFromThread(thread, 'user-1', '   '),
      ).rejects.toBeInstanceOf(EmptySemantleGuessError);
    });
  });
});
