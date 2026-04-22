import { Collection } from 'discord.js';
import { UserCommands } from '../user.commands';
import { UserService } from '../user.service';
import { Department } from '../user.constants';
import { AdminLoginDto } from '../dto/admin-login.dto';
import { SyncMembersDto } from '../dto/sync-members.dto';
import { RegisterMemberDto } from '../dto/register-member.dto';
import { TeamBuildDto } from '../dto/team-build.dto';

describe('UserCommands', () => {
  let commands: UserCommands;
  let mockUserService: Record<string, jest.Mock>;

  function createInteraction(overrides: Record<string, unknown> = {}) {
    return {
      user: { id: 'user-1', displayName: '홍길동' },
      reply: jest.fn(),
      deferReply: jest.fn(),
      editReply: jest.fn(),
      guild: {
        members: {
          fetch: jest.fn(),
        },
      },
      ...overrides,
    };
  }

  beforeEach(() => {
    mockUserService = {
      adminLogin: jest.fn(),
      syncMembers: jest.fn(),
      registerMember: jest.fn(),
      getTeamList: jest.fn(),
      buildTeam: jest.fn(),
    };

    commands = new UserCommands(mockUserService as unknown as UserService);
  });

  describe('/admin-login', () => {
    it('성공 시 권한 부여 안내를 ephemeral로 보낸다', async () => {
      mockUserService.adminLogin.mockResolvedValue(true);
      const interaction = createInteraction();
      const dto: AdminLoginDto = { password: 'mashup1234' };

      await commands.onAdminLogin([interaction] as never, dto);

      expect(mockUserService.adminLogin).toHaveBeenCalledWith(
        'user-1',
        '홍길동',
        'mashup1234',
      );
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          ephemeral: true,
          content: expect.stringContaining('관리자') as string,
        }),
      );
    });

    it('실패 시 비밀번호 오류 안내를 보낸다', async () => {
      mockUserService.adminLogin.mockResolvedValue(false);
      const interaction = createInteraction();
      const dto: AdminLoginDto = { password: 'wrong' };

      await commands.onAdminLogin([interaction] as never, dto);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          ephemeral: true,
          content: expect.stringContaining('비밀번호') as string,
        }),
      );
    });
  });

  describe('/sync-members', () => {
    it('길드가 없으면 안내 메시지를 보낸다', async () => {
      const interaction = createInteraction({ guild: null });
      const dto: SyncMembersDto = { generation: 16 };

      await commands.onSyncMembers([interaction] as never, dto);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          ephemeral: true,
          content: expect.stringContaining('길드') as string,
        }),
      );
    });

    it('봇을 제외한 멤버를 동기화하고 결과를 응답한다', async () => {
      const fetchedMembers = new Collection<string, unknown>([
        ['1', { id: '1', displayName: '[노드]A', user: { bot: false } }],
        ['2', { id: '2', displayName: '[디자인]B', user: { bot: false } }],
        ['3', { id: '3', displayName: 'BotName', user: { bot: true } }],
      ]);
      const interaction = createInteraction();
      interaction.guild.members.fetch.mockResolvedValue(fetchedMembers);
      mockUserService.syncMembers.mockResolvedValue({
        synced: 2,
        failed: [],
      });
      const dto: SyncMembersDto = { generation: 16 };

      await commands.onSyncMembers([interaction] as never, dto);

      expect(interaction.deferReply).toHaveBeenCalled();
      expect(mockUserService.syncMembers).toHaveBeenCalledWith(
        [
          { discordId: '1', displayName: '[노드]A' },
          { discordId: '2', displayName: '[디자인]B' },
        ],
        16,
      );
      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('2명') as string,
        }),
      );
    });

    it('파싱 실패 멤버를 결과에 포함한다', async () => {
      const fetchedMembers = new Collection<string, unknown>([
        ['1', { id: '1', displayName: '태그없음', user: { bot: false } }],
      ]);
      const interaction = createInteraction();
      interaction.guild.members.fetch.mockResolvedValue(fetchedMembers);
      mockUserService.syncMembers.mockResolvedValue({
        synced: 1,
        failed: [{ discordId: '1', displayName: '태그없음' }],
      });
      const dto: SyncMembersDto = { generation: 16 };

      await commands.onSyncMembers([interaction] as never, dto);

      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('태그없음') as string,
        }),
      );
    });
  });

  describe('/register-member', () => {
    it('등록한 멤버 정보를 응답한다', async () => {
      const targetUser = { id: 'user-2', displayName: '김철수' };
      const interaction = createInteraction();
      interaction.guild.members.fetch.mockResolvedValue({
        displayName: '[스프링]김철수',
      });
      mockUserService.registerMember.mockResolvedValue({
        nickname: '김철수',
        department: Department.Spring,
        generation: 17,
      });
      const dto: RegisterMemberDto = {
        user: targetUser as never,
        department: Department.Spring,
        generation: 17,
      };

      await commands.onRegisterMember([interaction] as never, dto);

      expect(mockUserService.registerMember).toHaveBeenCalledWith(
        'user-2',
        '[스프링]김철수',
        Department.Spring,
        17,
      );
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('등록 완료') as string,
        }),
      );
    });
  });

  describe('/team-list', () => {
    it('팀이 없으면 안내 메시지를 보낸다', async () => {
      mockUserService.getTeamList.mockResolvedValue([]);
      const interaction = createInteraction();

      await commands.onTeamList([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('생성된 팀') as string,
        }),
      );
    });

    it('팀과 멤버를 함께 표시한다', async () => {
      mockUserService.getTeamList.mockResolvedValue([
        {
          name: '1조',
          members: [
            {
              nickname: 'A',
              department: Department.Node,
              score: 30,
            },
          ],
        },
      ]);
      const interaction = createInteraction();

      await commands.onTeamList([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringMatching(/1조.*A.*30/s) as string,
        }),
      );
    });

    it('멤버가 없는 팀은 (멤버 없음)으로 표시한다', async () => {
      mockUserService.getTeamList.mockResolvedValue([
        { name: '1조', members: [] },
      ]);
      const interaction = createInteraction();

      await commands.onTeamList([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('멤버 없음') as string,
        }),
      );
    });
  });

  describe('/team-build', () => {
    it('멤버 멘션이 없으면 안내 메시지를 보낸다', async () => {
      const interaction = createInteraction();
      const dto: TeamBuildDto = { name: '1조', members: '멤버없음' };

      await commands.onTeamBuild([interaction] as never, dto);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          ephemeral: true,
          content: expect.stringContaining('1명 이상') as string,
        }),
      );
      expect(mockUserService.buildTeam).not.toHaveBeenCalled();
    });

    it('멘션을 파싱해 팀을 생성하고 결과를 응답한다', async () => {
      mockUserService.buildTeam.mockResolvedValue({
        name: '1조',
        members: [
          { discordId: '111', nickname: 'A' },
          { discordId: '222', nickname: 'B' },
        ],
      });
      const interaction = createInteraction();
      const dto: TeamBuildDto = {
        name: '1조',
        members: '<@111> <@!222>',
      };

      await commands.onTeamBuild([interaction] as never, dto);

      expect(mockUserService.buildTeam).toHaveBeenCalledWith('1조', [
        '111',
        '222',
      ]);
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('1조') as string,
        }),
      );
    });
  });
});
