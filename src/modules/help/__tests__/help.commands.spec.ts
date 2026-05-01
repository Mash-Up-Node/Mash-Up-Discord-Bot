import { HelpCommands } from '../help.commands';

describe('HelpCommands', () => {
  let commands: HelpCommands;

  beforeEach(() => {
    commands = new HelpCommands();
  });

  describe('/help', () => {
    it('ephemeral로 명령어 안내를 응답한다', async () => {
      const interaction = { reply: jest.fn() };

      await commands.onHelp([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({ ephemeral: true }),
      );
    });

    it('일반 명령어와 관리자 명령어를 모두 포함한다', async () => {
      const interaction = { reply: jest.fn() };

      await commands.onHelp([interaction] as never);

      const content = interaction.reply.mock.calls[0][0].content as string;
      expect(content).toContain('/공부시간');
      expect(content).toContain('/my-score');
      expect(content).toContain('/admin-grant');
      expect(content).toContain('/시즌-종료');
      expect(content).toContain('관리자 전용');
    });
  });
});
