import {
  formatSemantleGuessReply,
  formatSemantleInvalidGuessReply,
  formatSemantleRank,
  formatSemantleScore,
  formatSemantleThreadIntro,
} from '../semantle-message.formatter';

describe('semantle-message.formatter', () => {
  it('API score를 화면 점수로 포맷한다', () => {
    expect(formatSemantleScore(0.0876213014125824)).toBe('8.76');
  });

  it('rank 숫자에는 위를 붙이고 문자열 rank는 그대로 둔다', () => {
    expect(formatSemantleRank(1)).toBe('1위');
    expect(formatSemantleRank('1000위 이상')).toBe('1000위 이상');
    expect(formatSemantleRank('정답!')).toBe('정답!');
  });

  it('일반 추측 응답 메시지를 만든다', () => {
    expect(
      formatSemantleGuessReply('user-1', {
        guess: '놀랍다',
        sim: 0.0876213014125824,
        rank: '1000위 이상',
      }),
    ).toBe(
      '<@user-1> 님의 `놀랍다`는 유사도 8.76 (유사도 순위 1000위 이상) 입니다.',
    );
  });

  it('정답 응답 메시지를 만든다', () => {
    expect(
      formatSemantleGuessReply('user-1', {
        guess: '놀랍다',
        sim: 1,
        rank: '정답!',
      }),
    ).toBe(
      '🎉 <@user-1> 님이 정답 `놀랍다`을(를) 맞혔습니다! 유사도 100.00 입니다. 그래도 계속 추측할 수 있어요.',
    );
  });

  it('알 수 없는 단어 메시지를 만든다', () => {
    expect(formatSemantleInvalidGuessReply('없는단어zzzzz')).toBe(
      '`없는단어zzzzz`은(는) 알 수 없는 단어입니다.',
    );
  });

  it('스레드 안내 메시지를 만든다', () => {
    const content = formatSemantleThreadIntro({
      answer_id: 1485,
      '1st_score': 0.5066384077072144,
      '10th_score': 0.45334914326667786,
      '1000th_score': 0.2307651787996292,
      previous: { answer_id: 1484, key: '놀랍다' },
    });

    expect(content).toContain('# 꼬맨틀 #1485');
    expect(content).toContain('가장 유사한 단어의 유사도: 50.66');
    expect(content).toContain('/꼬맨틀 word:사람');
  });
});
