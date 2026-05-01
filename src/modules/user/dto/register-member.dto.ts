import { User } from 'discord.js';
import { NumberOption, StringOption, UserOption } from 'necord';
import { Department } from '../user.constants';

export class RegisterMemberDto {
  @UserOption({
    name: 'user',
    description: '대상 유저',
    required: true,
  })
  user!: User;

  @StringOption({
    name: 'department',
    description: '직무',
    required: true,
    choices: [
      { name: '노드', value: Department.Node },
      { name: '스프링', value: Department.Spring },
      { name: '디자인', value: Department.Design },
      { name: '아오스', value: Department.iOS },
      { name: '안드', value: Department.Android },
      { name: '웹', value: Department.Web },
    ],
  })
  department!: Department;

  @NumberOption({
    name: 'generation',
    description: '기수',
    required: true,
    min_value: 1,
  })
  generation!: number;
}
