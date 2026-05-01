import { Injectable, UseGuards } from '@nestjs/common';
import { MessageFlags } from 'discord.js';
import { Context, Options, SlashCommand, SlashCommandContext } from 'necord';
import { CategoryService } from './category.service';
import { CategoryAddDto } from './dto/category-add.dto';
import { AdminGuard } from '../user/admin.guard';

@Injectable()
export class CategoryCommands {
  constructor(private readonly categoryService: CategoryService) {}

  @UseGuards(AdminGuard)
  @SlashCommand({
    name: '카테고리추가',
    description: '공부 시간 추적 대상 카테고리를 추가합니다. (관리자 전용)',
  })
  async onAdd(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: CategoryAddDto,
  ): Promise<void> {
    const { id, name } = dto.category;
    const added = await this.categoryService.add(id, name);

    await interaction.reply({
      content: added
        ? `${name} 카테고리를 추가했습니다.`
        : `${name} 카테고리는 이미 등록되어 있습니다.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  @SlashCommand({
    name: '카테고리목록',
    description: '등록된 공부 카테고리 목록을 확인합니다.',
  })
  async onList(@Context() [interaction]: SlashCommandContext): Promise<void> {
    const categories = await this.categoryService.list();

    if (categories.length === 0) {
      await interaction.reply({
        content: '등록된 카테고리가 없습니다.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const lines = categories.map(
      (category, index) =>
        `${index + 1}. ${category.name} (id: ${category.categoryId})`,
    );

    await interaction.reply({
      content: `**공부 카테고리 목록**\n${lines.join('\n')}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
