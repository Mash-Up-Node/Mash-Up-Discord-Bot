import { NotSemantleThreadError } from '../semantle.error';
import { SemantleCommands } from '../semantle.commands';
import { SemantleService } from '../semantle.service';

function createMockInteraction(channel: unknown, userId = 'user-1') {
  return {
    channel,
    channelId: 'channel-1',
    user: { id: userId },
    client: {
      channels: {
        fetch: jest.fn(),
      },
    },
    deferReply: jest.fn(),
    editReply: jest.fn(),
  };
}

describe('SemantleCommands', () => {
  let commands: SemantleCommands;
  let semantleService: Record<string, jest.Mock>;

  beforeEach(() => {
    semantleService = {
      openTodayThread: jest.fn(),
      submitGuessFromThread: jest.fn(),
      getAnswerIdFromThread: jest.fn(),
    };

    commands = new SemantleCommands(
      semantleService as unknown as SemantleService,
    );
  });

  it('단어 옵션이 없으면 일반 채널에 오늘 꼬맨틀 스레드를 만든다', async () => {
    const channel = {
      isThread: () => false,
      threads: {
        create: jest.fn(),
        fetchActive: jest.fn(),
      },
    };
    const thread = { toString: () => '<#thread-1>' };
    semantleService.openTodayThread.mockResolvedValue({
      today: { answer_id: 1485 },
      thread,
      created: true,
    });
    const interaction = createMockInteraction(channel);

    await commands.onSemantle([interaction] as never, {});

    expect(interaction.deferReply).toHaveBeenCalled();
    expect(semantleService.openTodayThread).toHaveBeenCalledWith(channel);
    expect(interaction.editReply).toHaveBeenCalledWith({
      content: '✅ 오늘의 꼬맨틀 스레드를 만들었어요: <#thread-1>',
    });
  });

  it('오늘 꼬맨틀 스레드가 이미 있으면 기존 스레드를 안내한다', async () => {
    const channel = {
      isThread: () => false,
      threads: {
        create: jest.fn(),
        fetchActive: jest.fn(),
      },
    };
    const thread = { toString: () => '<#thread-1>' };
    semantleService.openTodayThread.mockResolvedValue({
      today: { answer_id: 1485 },
      thread,
      created: false,
    });
    const interaction = createMockInteraction(channel);

    await commands.onSemantle([interaction] as never, {});

    expect(interaction.editReply).toHaveBeenCalledWith({
      content: 'ℹ️ 오늘의 꼬맨틀 스레드가 이미 있어요: <#thread-1>',
    });
  });

  it('스레드 안에서 단어 옵션이 있으면 추측을 제출한다', async () => {
    const thread = { isThread: () => true, name: '꼬맨틀 #1485' };
    semantleService.submitGuessFromThread.mockResolvedValue({
      status: 'guessed',
      content:
        '<@user-1> 님의 `사람`는 유사도 13.18 (유사도 순위 1000위 이상) 입니다.',
    });
    const interaction = createMockInteraction(thread);

    await commands.onSemantle([interaction] as never, { word: ' 사람 ' });

    expect(semantleService.submitGuessFromThread).toHaveBeenCalledWith(
      thread,
      'user-1',
      '사람',
    );
    expect(interaction.editReply).toHaveBeenCalledWith({
      content:
        '<@user-1> 님의 `사람`는 유사도 13.18 (유사도 순위 1000위 이상) 입니다.',
    });
  });

  it('일반 채널에서 단어 옵션을 넣으면 스레드 안에서 추측하라고 안내한다', async () => {
    const channel = {
      isThread: () => false,
      threads: {
        create: jest.fn(),
        fetchActive: jest.fn(),
      },
    };
    const interaction = createMockInteraction(channel);

    await commands.onSemantle([interaction] as never, { word: '사람' });

    expect(semantleService.submitGuessFromThread).not.toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith({
      content:
        '단어 추측은 꼬맨틀 스레드 안에서 `/꼬맨틀 word:단어`처럼 입력해주세요.',
    });
  });

  it('스레드 안에서 단어 옵션이 없으면 사용법을 안내한다', async () => {
    const thread = { isThread: () => true, name: '꼬맨틀 #1485' };
    const interaction = createMockInteraction(thread);

    await commands.onSemantle([interaction] as never, {});

    expect(semantleService.openTodayThread).not.toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith({
      content: '스레드에서는 `/꼬맨틀 word:단어`처럼 추측해주세요.',
    });
  });

  it('스레드를 만들 수 없는 채널에서는 안내 메시지를 보낸다', async () => {
    const channel = { isThread: () => false };
    const interaction = createMockInteraction(channel);

    await commands.onSemantle([interaction] as never, {});

    expect(semantleService.openTodayThread).not.toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith({
      content: '꼬맨틀 스레드는 일반 채널에서만 만들 수 있습니다.',
    });
  });

  it('꼬맨틀 스레드가 아닌 곳에서 추측하면 안내 메시지를 보낸다', async () => {
    const thread = { isThread: () => true, name: '잡담' };
    semantleService.submitGuessFromThread.mockRejectedValue(
      new NotSemantleThreadError('잡담'),
    );
    const interaction = createMockInteraction(thread);

    await commands.onSemantle([interaction] as never, { word: '사람' });

    expect(interaction.editReply).toHaveBeenCalledWith({
      content:
        '이 스레드는 꼬맨틀 스레드가 아닙니다. `/꼬맨틀`로 꼬맨틀 스레드를 먼저 만들어주세요.',
    });
  });
});
