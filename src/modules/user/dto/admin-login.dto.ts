import { StringOption } from 'necord';

export class AdminLoginDto {
  @StringOption({
    name: 'password',
    description: '관리자 비밀번호',
    required: true,
  })
  password!: string;
}
