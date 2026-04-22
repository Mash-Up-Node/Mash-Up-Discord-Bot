import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { NecordExecutionContext, SlashCommandContext } from 'necord';
import { UserService } from './user.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const necordCtx = NecordExecutionContext.create(context);
    const [interaction] = necordCtx.getContext<SlashCommandContext>();

    const allowed = await this.userService.isAdmin(interaction.user.id);
    if (!allowed) {
      await interaction.reply({
        content: '관리자만 사용할 수 있습니다.',
        ephemeral: true,
      });
    }
    return allowed;
  }
}
