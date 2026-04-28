import { User } from 'discord.js';
import { UserOption } from 'necord';

export class AdminUserDto {
  @UserOption({
    name: 'user',
    description: '대상 유저',
    required: true,
  })
  user!: User;
}
