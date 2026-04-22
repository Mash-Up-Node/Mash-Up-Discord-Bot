import { ExecutionContext } from '@nestjs/common';
import { AdminGuard } from '../admin.guard';
import { UserService } from '../user.service';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let mockUserService: { isAdmin: jest.Mock };

  function createContext(interaction: {
    user: { id: string };
    reply: jest.Mock;
  }): ExecutionContext {
    return {
      getArgs: () => [[interaction], {}],
      getClass: () => class {},
      getHandler: () => () => undefined,
      getType: () => 'necord',
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    mockUserService = { isAdmin: jest.fn() };
    guard = new AdminGuard(mockUserService as unknown as UserService);
  });

  it('관리자이면 true를 반환한다', async () => {
    mockUserService.isAdmin.mockResolvedValue(true);
    const interaction = { user: { id: 'admin' }, reply: jest.fn() };

    const result = await guard.canActivate(createContext(interaction));

    expect(result).toBe(true);
    expect(interaction.reply).not.toHaveBeenCalled();
  });

  it('관리자가 아니면 false를 반환하고 안내 메시지를 ephemeral로 보낸다', async () => {
    mockUserService.isAdmin.mockResolvedValue(false);
    const interaction = { user: { id: 'user' }, reply: jest.fn() };

    const result = await guard.canActivate(createContext(interaction));

    expect(result).toBe(false);
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        ephemeral: true,
        content: expect.stringContaining('관리자만') as string,
      }),
    );
  });
});
