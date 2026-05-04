import { User } from 'discord.js';
import { UserCommands } from '../user.commands';
import { UserService } from '../user.service';
import { Department } from '../user.constants';
import { AdminUserDto } from '../dto/admin-user.dto';
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
      findByDiscordId: jest.fn(),
      setAdmin: jest.fn(),
      registerMember: jest.fn(),
      getTeamList: jest.fn(),
      buildTeam: jest.fn(),
    };

    commands = new UserCommands(mockUserService as unknown as UserService);
  });

  describe('/관리자-부여', () => {
    it('동기화되지 않은 유저는 안내 메시지를 보낸다', async () => {
      mockUserService.findByDiscordId.mockResolvedValue(null);
      const interaction = createInteraction();
      const dto: AdminUserDto = { user: { id: 'u1' } as User };

      await commands.onAdminGrant([interaction] as never, dto);

      expect(mockUserService.setAdmin).not.toHaveBeenCalled();
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          ephemeral: true,
          content: expect.stringContaining('동기화') as string,
        }),
      );
    });

    it('이미 관리자인 유저는 안내 메시지를 보낸다', async () => {
      mockUserService.findByDiscordId.mockResolvedValue({ isAdmin: true });
      const interaction = createInteraction();
      const dto: AdminUserDto = { user: { id: 'u1' } as User };

      await commands.onAdminGrant([interaction] as never, dto);

      expect(mockUserService.setAdmin).not.toHaveBeenCalled();
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          ephemeral: true,
          content: expect.stringContaining('이미 관리자') as string,
        }),
      );
    });

    it('관리자 권한을 부여하고 ephemeral로 응답한다', async () => {
      mockUserService.findByDiscordId.mockResolvedValue({ isAdmin: false });
      const interaction = createInteraction();
      const dto: AdminUserDto = { user: { id: 'u1' } as User };

      await commands.onAdminGrant([interaction] as never, dto);

      expect(mockUserService.setAdmin).toHaveBeenCalledWith('u1', true);
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          ephemeral: true,
          content: expect.stringContaining('부여') as string,
        }),
      );
    });
  });

  describe('/관리자-해제', () => {
    it('등록되지 않은 유저는 안내 메시지를 보낸다', async () => {
      mockUserService.findByDiscordId.mockResolvedValue(null);
      const interaction = createInteraction();
      const dto: AdminUserDto = { user: { id: 'u1' } as User };

      await commands.onAdminRevoke([interaction] as never, dto);

      expect(mockUserService.setAdmin).not.toHaveBeenCalled();
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          ephemeral: true,
          content: expect.stringContaining('등록') as string,
        }),
      );
    });

    it('관리자가 아닌 유저는 안내 메시지를 보낸다', async () => {
      mockUserService.findByDiscordId.mockResolvedValue({ isAdmin: false });
      const interaction = createInteraction();
      const dto: AdminUserDto = { user: { id: 'u1' } as User };

      await commands.onAdminRevoke([interaction] as never, dto);

      expect(mockUserService.setAdmin).not.toHaveBeenCalled();
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          ephemeral: true,
          content: expect.stringContaining('관리자가 아닙니다') as string,
        }),
      );
    });

    it('관리자 권한을 해제하고 ephemeral로 응답한다', async () => {
      mockUserService.findByDiscordId.mockResolvedValue({ isAdmin: true });
      const interaction = createInteraction();
      const dto: AdminUserDto = { user: { id: 'u1' } as User };

      await commands.onAdminRevoke([interaction] as never, dto);

      expect(mockUserService.setAdmin).toHaveBeenCalledWith('u1', false);
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          ephemeral: true,
          content: expect.stringContaining('해제') as string,
        }),
      );
    });
  });

  describe('/멤버-등록', () => {
    it('등록한 멤버 정보를 ephemeral로 응답한다', async () => {
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
          ephemeral: true,
          content: expect.stringContaining('등록 완료') as string,
        }),
      );
    });
  });

  describe('/팀-목록', () => {
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

  describe('/팀-생성', () => {
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

    it('멘션을 파싱해 팀을 생성하고 ephemeral로 응답한다', async () => {
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
          ephemeral: true,
          content: expect.stringContaining('1조') as string,
        }),
      );
    });
  });
});
