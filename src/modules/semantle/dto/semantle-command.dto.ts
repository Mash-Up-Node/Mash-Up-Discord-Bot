import { StringOption } from 'necord';

export class SemantleCommandDto {
  @StringOption({
    name: 'word',
    description: '꼬맨틀 스레드 안에서 추측할 단어',
    required: false,
  })
  word?: string;
}
