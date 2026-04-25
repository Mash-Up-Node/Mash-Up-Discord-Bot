import {
  buildSemantleThreadName,
  isSemantleThreadName,
  parseSemantleAnswerIdFromThreadName,
} from '../semantle-thread.util';

describe('semantle-thread.util', () => {
  it('꼬맨틀 스레드 이름을 만든다', () => {
    expect(buildSemantleThreadName(1485)).toBe('꼬맨틀 #1485');
  });

  it('꼬맨틀 스레드 이름에서 answerId를 파싱한다', () => {
    expect(parseSemantleAnswerIdFromThreadName('꼬맨틀 #1485')).toBe(1485);
    expect(isSemantleThreadName('꼬맨틀 #1485')).toBe(true);
  });

  it('꼬맨틀 스레드가 아니면 null을 반환한다', () => {
    expect(parseSemantleAnswerIdFromThreadName('잡담')).toBeNull();
    expect(parseSemantleAnswerIdFromThreadName('꼬맨틀')).toBeNull();
    expect(isSemantleThreadName('잡담')).toBe(false);
  });
});
