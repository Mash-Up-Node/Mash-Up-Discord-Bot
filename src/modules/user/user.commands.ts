import { Injectable, UseGuards } from '@nestjs/common';
import { Context, Options, SlashCommand, SlashCommandContext } from 'necord';
import { UserService } from './user.service';
import { AdminGuard } from './admin.guard';
import { AdminLoginDto } from './dto/admin-login.dto';
import { SyncMembersDto } from './dto/sync-members.dto';
import { RegisterMemberDto } from './dto/register-member.dto';
import { TeamBuildDto } from './dto/team-build.dto';

const MENTION_REGEX = /<@!?(\d+)>/g;

@Injectable()
export class UserCommands {
  constructor(private readonly userService: UserService) {}

  @SlashCommand({
    name: 'admin-login',
    description: '관리자 모드를 활성화합니다.',
  })
  async onAdminLogin(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: AdminLoginDto,
  ): Promise<void> {
    const success = await this.userService.adminLogin(
      interaction.user.id,
      interaction.user.displayName,
      dto.password,
    );

    await interaction.reply({
      content: success
        ? '관리자 권한이 부여되었습니다.'
        : '비밀번호가 올바르지 않습니다.',
      ephemeral: true,
    });
  }

  @UseGuards(AdminGuard)
  @SlashCommand({
    name: 'sync-members',
    description: '서버 멤버를 동기화합니다. (관리자 전용)',
  })
  async onSyncMembers(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: SyncMembersDto,
  ): Promise<void> {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        content: '길드 정보를 가져올 수 없습니다.',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    const members = await guild.members.fetch();
    const payload = members
      .filter((m) => !m.user.bot)
      .map((m) => ({ discordId: m.id, displayName: m.displayName }));

    const result = await this.userService.syncMembers(payload, dto.generation);

    const failedList =
      result.failed.length === 0
        ? '없음'
        : result.failed
            .map((f) => `<@${f.discordId}> (${f.displayName})`)
            .join('\n');

    await interaction.editReply({
      content: `**동기화 완료**\n동기화된 멤버: ${result.synced}명\n파싱 실패: ${result.failed.length}명\n${failedList}`,
    });
  }

  @UseGuards(AdminGuard)
  @SlashCommand({
    name: 'register-member',
    description: '멤버 정보를 수동으로 등록/수정합니다. (관리자 전용)',
  })
  async onRegisterMember(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: RegisterMemberDto,
  ): Promise<void> {
    const guild = interaction.guild;
    const member = guild
      ? await guild.members.fetch(dto.user.id).catch(() => null)
      : null;
    const nickname = member?.displayName ?? dto.user.displayName;

    const user = await this.userService.registerMember(
      dto.user.id,
      nickname,
      dto.department,
      dto.generation,
    );

    await interaction.reply({
      content: `**등록 완료**\n${user.nickname} (${user.department}, ${user.generation}기)`,
    });
  }

  @SlashCommand({
    name: 'team-list',
    description: '팀 목록과 멤버 구성을 확인합니다.',
  })
  async onTeamList(
    @Context() [interaction]: SlashCommandContext,
  ): Promise<void> {
    const teams = await this.userService.getTeamList();

    if (teams.length === 0) {
      await interaction.reply({ content: '아직 생성된 팀이 없습니다.' });
      return;
    }

    const lines = teams.map((team) => {
      const memberLines = team.members
        .map((u) => `- ${u.nickname} (${u.department}, ${u.score}점)`)
        .join('\n');
      return `**${team.name}**\n${memberLines || '- (멤버 없음)'}`;
    });

    await interaction.reply({ content: lines.join('\n\n') });
  }

  @UseGuards(AdminGuard)
  @SlashCommand({
    name: 'team-build',
    description: '팀을 생성하고 멤버를 배정합니다. (관리자 전용)',
  })
  async onTeamBuild(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: TeamBuildDto,
  ): Promise<void> {
    const memberIds = Array.from(dto.members.matchAll(MENTION_REGEX)).map(
      (m) => m[1],
    );

    if (memberIds.length === 0) {
      await interaction.reply({
        content: '멤버를 1명 이상 멘션해주세요.',
        ephemeral: true,
      });
      return;
    }

    const team = await this.userService.buildTeam(dto.name, memberIds);
    const memberMentions = team.members
      .map((u) => `<@${u.discordId}>`)
      .join(' ');

    await interaction.reply({
      content: `**팀 생성 완료**\n${team.name} (${team.members.length}명)\n${memberMentions || '_등록된 멤버 없음_'}`,
    });
  }
}
