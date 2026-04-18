import { CategoryCommands } from '../category.commands';
import { CategoryService } from '../category.service';
import { CategoryAddDto } from '../dto/category-add.dto';

describe('CategoryCommands', () => {
  let commands: CategoryCommands;
  let mockService: Record<string, jest.Mock>;

  function createMockInteraction() {
    return {
      reply: jest.fn(),
    };
  }

  beforeEach(() => {
    mockService = {
      add: jest.fn(),
      list: jest.fn(),
      has: jest.fn(),
    };

    commands = new CategoryCommands(mockService as unknown as CategoryService);
  });

  describe('/카테고리추가', () => {
    it('새 카테고리를 추가하면 성공 메시지를 보낸다', async () => {
      mockService.add.mockResolvedValue(true);
      const interaction = createMockInteraction();
      const dto = new CategoryAddDto();
      dto.category = { id: 'cat-1', name: '스터디A' } as never;

      await commands.onAdd([interaction] as never, dto);

      expect(mockService.add).toHaveBeenCalledWith('cat-1', '스터디A');
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('추가했습니다') as string,
        }),
      );
    });

    it('이미 등록된 카테고리면 안내 메시지를 보낸다', async () => {
      mockService.add.mockResolvedValue(false);
      const interaction = createMockInteraction();
      const dto = new CategoryAddDto();
      dto.category = { id: 'cat-1', name: '스터디A' } as never;

      await commands.onAdd([interaction] as never, dto);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('이미 등록') as string,
        }),
      );
    });
  });

  describe('/카테고리목록', () => {
    it('등록된 카테고리가 없으면 안내 메시지를 보낸다', async () => {
      mockService.list.mockResolvedValue([]);
      const interaction = createMockInteraction();

      await commands.onList([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('등록된 카테고리가 없') as string,
        }),
      );
    });

    it('목록을 표시한다', async () => {
      mockService.list.mockResolvedValue([
        { id: 1, categoryId: 'cat-1', name: '스터디A' },
        { id: 2, categoryId: 'cat-2', name: '스터디B' },
      ]);
      const interaction = createMockInteraction();

      await commands.onList([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('스터디A') as string,
        }),
      );
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('스터디B') as string,
        }),
      );
    });
  });
});
