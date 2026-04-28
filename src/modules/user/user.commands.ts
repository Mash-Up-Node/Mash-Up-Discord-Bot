import { Injectable, UseGuards } from '@nestjs/common';
import { Context, Options, SlashCommand, SlashCommandContext } from 'necord';
import { UserService } from './user.service';
import { AdminGuard } from './admin.guard';
import { AdminUserDto } from './dto/admin-user.dto';
import { RegisterMemberDto } from './dto/register-member.dto';
import { TeamBuildDto } from './dto/team-build.dto';

const MENTION_REGEX = /<@!?(\d+)>/g;

@Injectable()
export class UserCommands {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AdminGuard)
  @SlashCommand({
    name: 'admin-grant',
    description: '대상 유저에게 관리자 권한을 부여합니다. (관리자 전용)',
  })
  async onAdminGrant(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: AdminUserDto,
  ): Promise<void> {
    const existing = await this.userService.findByDiscordId(dto.user.id);
    if (!existing) {
      await interaction.reply({
        content: `<@${dto.user.id}>은(는) 아직 동기화되지 않은 유저입니다. 자정 동기화 후 다시 시도하거나 \`/register-member\`로 먼저 등록해주세요.`,
        ephemeral: true,
      });
      return;
    }

    if (existing.isAdmin) {
      await interaction.reply({
        content: `<@${dto.user.id}>은(는) 이미 관리자입니다.`,
        ephemeral: true,
      });
      return;
    }

    await this.userService.setAdmin(dto.user.id, true);
    await interaction.reply({
      content: `<@${dto.user.id}>에게 관리자 권한을 부여했습니다.`,
      ephemeral: true,
    });
  }

  @UseGuards(AdminGuard)
  @SlashCommand({
    name: 'admin-revoke',
    description: '대상 유저의 관리자 권한을 해제합니다. (관리자 전용)',
  })
  async onAdminRevoke(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: AdminUserDto,
  ): Promise<void> {
    const existing = await this.userService.findByDiscordId(dto.user.id);
    if (!existing) {
      await interaction.reply({
        content: `<@${dto.user.id}>은(는) 등록되지 않은 유저입니다.`,
        ephemeral: true,
      });
      return;
    }

    if (!existing.isAdmin) {
      await interaction.reply({
        content: `<@${dto.user.id}>은(는) 관리자가 아닙니다.`,
        ephemeral: true,
      });
      return;
    }

    await this.userService.setAdmin(dto.user.id, false);
    await interaction.reply({
      content: `<@${dto.user.id}>의 관리자 권한을 해제했습니다.`,
      ephemeral: true,
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
      ephemeral: true,
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
      ephemeral: true,
    });
  }
}
