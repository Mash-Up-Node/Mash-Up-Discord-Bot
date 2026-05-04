import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, SlashCommandContext } from 'necord';

const HELP_TEXT = `**Mash-Up Bot 명령어 안내**

**스터디**
\`/공부시간 [user] [category]\` — 누적 공부 시간 조회 (본인 또는 다른 멤버)
\`/공부순위 [category]\` — 공부 시간 순위표
\`/팀공부순위\` — 현재 채널의 팀(카테고리) 공부 시간 순위표
\`/카테고리목록\` — 등록된 공부 카테고리 목록

**점수 / 팀**
\`/my-score\` — 내 점수와 소속 팀 확인
\`/score-rank\` — 팀별 합산 점수 랭킹
\`/team-list\` — 팀 목록과 멤버 구성

**이벤트**
\`/이벤트\` — 구독 중인 조직의 예정 이벤트 목록
\`/이벤트-구독 slug:\` — 현재 채널에 Ticketaco 이벤트 구독

**일상**
\`/오늘날씨 [location]\` — 오늘의 날씨와 미세먼지
\`/오늘운세 birth:\` — 오늘의 운세
\`/내일운세 birth:\` — 내일의 운세

**기타**
\`/꼬맨틀\` — 오늘의 꼬맨틀 게임 (스레드 생성)
\`/예약\` — 일정 예약 대시보드
\`/ping\` — 봇 응답 확인

———

**관리자 전용**
\`/admin-grant user:@멤버\` — 관리자 권한 부여
\`/admin-revoke user:@멤버\` — 관리자 권한 해제
\`/register-member user: department: generation:\` — 멤버 수동 등록/수정
\`/team-build name: members:\` — 팀 생성 및 멤버 배정
\`/카테고리추가 category:\` — 공부 카테고리 추가
\`/시즌-종료\` — 시즌 종료 (모든 점수·팀 초기화)`;

@Injectable()
export class HelpCommands {
  @SlashCommand({
    name: 'help',
    description: '봇 명령어 안내를 확인합니다.',
  })
  async onHelp(@Context() [interaction]: SlashCommandContext): Promise<void> {
    await interaction.reply({
      content: HELP_TEXT,
      ephemeral: true,
    });
  }
}
