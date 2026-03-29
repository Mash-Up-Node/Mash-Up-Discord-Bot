export const DISCORD_ERRORS = {
  DISALLOWED_INTENTS: 'disallowed intents',
} as const;

export const DISCORD_ERROR_GUIDES = {
  DISALLOWED_INTENTS: [
    '',
    '[ERROR] Discord에서 Privileged Gateway Intents가 허용되지 않았습니다.',
    '',
    'Discord Developer Portal에서 아래 설정을 활성화해주세요:',
    '  1. Bot 탭 > Privileged Gateway Intents',
    '  2. "Server Members Intent" 토글 켜기',
    '  3. "Message Content Intent" 토글 켜기',
    '',
    'https://discord.com/developers/applications',
    '',
  ].join('\n'),
} as const;
