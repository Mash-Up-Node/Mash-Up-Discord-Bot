export const RESERVATION_MESSAGES = {
  commandDescription: '현재 채널 예약을 버튼과 메뉴로 관리합니다.',
  dashboard: {
    title: '🗓️ 일정 예약',
    descriptionLines: ['등록된 채널의 일정입니다.'],
    emptyStateLines: [
      '등록된 예약이 없어요.',
      '아래 버튼으로 일회성 또는 반복 예약을 추가해보세요.',
    ],
    tooManyNotice: '예약이 많아 상위 25개만 표시했습니다.',
    upcomingBannerPrefix: '⏰ 가까운 일정',
    upcomingBannerNone: '예정된 일정이 없어요.',
    buttonLabels: {
      once: '일회성 추가',
      weekly: '주간 일정 추가',
      refresh: '새로고침',
    },
    buttonEmojis: {
      once: '1️⃣',
      weekly: '🔁',
      refresh: '🔄',
    },
    selectPlaceholders: {
      weeklyDay: '반복할 요일을 선택해주세요.',
      manage: '관리할 일정을 선택해주세요.',
    },
    footerWithMeta: (count: number, updatedAt: string) =>
      `총 ${count}개 · ${updatedAt} 갱신`,
  },
  modals: {
    onceTitle: '🗓️ 일회성 일정',
    updateTitle: '✏️ 일정 수정',
    fieldLabels: {
      date: '📅 날짜',
      time: '🕒 시간',
      title: '📝 제목',
      reminderMessage: '💬 알림 메시지',
      reminderOffsetMinutes: '🔔 사전 알림',
    },
    placeholders: {
      onceDate: '예약할 날짜를 입력해주세요. 예: 2026-04-21',
      time: '예약 시간을 입력해주세요. 예: 19:30',
      onceTitle: '일정 제목을 입력해주세요. 예: 백엔드 스터디',
      weeklyTitle: '일정 제목을 입력해주세요. 예: 주간 회고',
      updateTitle: '변경할 제목을 입력해주세요. 예: 백엔드 스터디',
      onceReminderMessage:
        '알람이 갈 때 같이 표시할 메시지를 입력해주세요.\n예: 회의 시간이에요. 각자 의견을 자유롭게 나눠봐요.',
      weeklyReminderMessage:
        '알람이 갈 때 같이 표시할 메시지를 입력해주세요.\n예: 회고 시간이에요. 이번 주 배운 점을 함께 정리해봐요.',
      updateReminderMessage:
        '알람이 갈 때 같이 표시할 메시지를 입력해주세요.\n예: 발표 시간이에요. 질문이나 의견이 있으면 편하게 남겨주세요.',
      reminderOffsetMinutes:
        '사전 알림 시간을 입력해주세요. 예: 5 / 10 / 15 / 20',
    },
  },
  notices: {
    createdOnce: '✅ 일회성 일정을 등록했어요.',
    createdWeekly: '✅ 주간 일정을 등록했어요.',
    updated: '✏️ 일정 내용을 수정했어요.',
    deleted: '🗑️ 일정을 삭제했어요.',
    cancelled: '작업을 취소했어요.',
    nextScheduledPrefix: '다음 일정',
    refreshDashboardHint: '새로고침 버튼으로 잘 반영되었는지 확인해주세요.',
  },
  actionMessages: {
    manageAction: (title: string) => `**${title}** — 어떤 작업을 할까요?`,
    deleteConfirm: (title: string) =>
      `**${title}** 을(를) 삭제할까요? 이 작업은 되돌릴 수 없어요.`,
    manageButtonLabels: {
      edit: '수정',
      delete: '삭제',
      cancel: '취소',
      confirmDelete: '삭제 확정',
    },
    manageButtonEmojis: {
      edit: '✏️',
      delete: '🗑️',
      cancel: '↩️',
      confirmDelete: '🗑️',
    },
  },
  weeklyPicker: {
    title: '🔁 주간 일정 생성',
    description:
      '일정에 해당하는 요일을 선택하면 시간/제목을 입력하는 모달이 열려요.',
    cancelLabel: '취소',
    cancelEmoji: '↩️',
  },
  errors: {
    guildOnly: '서버 채널에서만 예약을 사용할 수 있습니다.',
    channelMissing: '채널 정보를 찾지 못했습니다.',
    updateTargetMissing:
      '수정할 예약을 찾지 못했습니다. 패널을 새로고침해주세요.',
    deleteTargetMissing:
      '삭제할 예약을 찾지 못했습니다. 패널을 새로고침해주세요.',
    manageTargetMissing:
      '선택한 예약을 찾지 못했습니다. 패널을 새로고침해주세요.',
    createFailed: '예약 등록에 실패했습니다.',
    updateFailed: '예약 수정에 실패했습니다.',
    unexpected: '예약 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  },
} as const;
