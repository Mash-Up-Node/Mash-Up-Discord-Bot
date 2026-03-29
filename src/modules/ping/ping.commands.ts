import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, SlashCommandContext } from 'necord';

@Injectable()
export class PingCommands {
  @SlashCommand({
    name: 'ping',
    description: '봇이 살아있는지 확인합니다.',
  })
  public async onPing(@Context() [interaction]: SlashCommandContext) {
    return interaction.reply({ content: 'Pong! 🏓' });
  }
}
