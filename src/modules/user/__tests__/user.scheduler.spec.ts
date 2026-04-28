import { ConfigService } from '@nestjs/config';
import { Client, Collection } from 'discord.js';
import { UserScheduler } from '../user.scheduler';
import { UserService } from '../user.service';

describe('UserScheduler', () => {
  let scheduler: UserScheduler;
  let mockClient: {
    isReady: jest.Mock;
    guilds: { cache: Map<string, unknown> };
  };
  let mockConfig: { getOrThrow: jest.Mock };
  let mockUserService: { syncMembers: jest.Mock };

  function createGuild(name: string, members: [string, unknown][]) {
    return {
      name,
      members: {
        fetch: jest
          .fn()
          .mockResolvedValue(new Collection<string, unknown>(members)),
      },
    };
  }

  beforeEach(() => {
    mockClient = {
      isReady: jest.fn().mockReturnValue(true),
      guilds: { cache: new Map() },
    };
    mockConfig = { getOrThrow: jest.fn().mockReturnValue('16') };
    mockUserService = {
      syncMembers: jest.fn().mockResolvedValue({ synced: 0, failed: [] }),
    };

    scheduler = new UserScheduler(
      mockClient as unknown as Client,
      mockConfig as unknown as ConfigService,
      mockUserService as unknown as UserService,
    );
  });

  it('client가 준비되지 않았으면 동기화를 건너뛴다', async () => {
    mockClient.isReady.mockReturnValue(false);

    await scheduler.syncMembersDaily();

    expect(mockUserService.syncMembers).not.toHaveBeenCalled();
  });

  it('MASHUP_GENERATION이 양의 정수가 아니면 에러 로그를 남기고 종료한다', async () => {
    mockConfig.getOrThrow.mockReturnValue('abc');

    await scheduler.syncMembersDaily();

    expect(mockUserService.syncMembers).not.toHaveBeenCalled();
  });

  it('모든 길드의 봇 제외 멤버를 fetch해서 동기화한다', async () => {
    const guild = createGuild('Mash-Up', [
      ['1', { id: '1', displayName: '[노드]A', user: { bot: false } }],
      ['2', { id: '2', displayName: '[디자인]B', user: { bot: false } }],
      ['bot', { id: 'bot', displayName: 'BotName', user: { bot: true } }],
    ]);
    mockClient.guilds.cache.set('g1', guild);

    await scheduler.syncMembersDaily();

    expect(guild.members.fetch).toHaveBeenCalled();
    expect(mockUserService.syncMembers).toHaveBeenCalledWith(
      [
        { discordId: '1', displayName: '[노드]A' },
        { discordId: '2', displayName: '[디자인]B' },
      ],
      16,
    );
  });

  it('한 길드 sync 실패 시에도 다른 길드는 계속 처리한다', async () => {
    const failingGuild = {
      name: 'Failing',
      members: { fetch: jest.fn().mockRejectedValue(new Error('network')) },
    };
    const okGuild = createGuild('OK', [
      ['1', { id: '1', displayName: '[노드]A', user: { bot: false } }],
    ]);
    mockClient.guilds.cache.set('g1', failingGuild);
    mockClient.guilds.cache.set('g2', okGuild);

    await scheduler.syncMembersDaily();

    expect(mockUserService.syncMembers).toHaveBeenCalledTimes(1);
    expect(mockUserService.syncMembers).toHaveBeenCalledWith(
      [{ discordId: '1', displayName: '[노드]A' }],
      16,
    );
  });
});
