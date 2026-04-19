export type DustLabel = '좋음' | '보통' | '나쁨' | '매우 나쁨';

export interface DustBand {
  max: number;
  label: DustLabel;
}

export const AIR_QUALITY_ADVICES: Record<DustLabel, string[]> = {
  좋음: [
    '오늘은 한강 코딩 가도 될 정도예요 🌿',
    '가볍게 산책하거나 바깥 바람 쐬기 딱 좋아요 😎',
    '오늘은 바깥 일정 잡아도 괜찮은 날이에요 ✅',
    '오늘 공기는 꽤 합격이에요. 바깥 일정 잡아도 무리 없어요.',
  ],
  보통: [
    '대체로 괜찮지만 예민한 편이면 마스크 하나쯤 챙겨두세요 🙂',
    '무난한 편이긴 한데 민감하다면 마스크 챙기는 게 마음 편해요.',
    '오늘 공기 상태는 무난한 편이에요. 예민하시면 마스크만 슬쩍 챙겨주세요.',
    '바깥 일정 가능! 다만 컨디션 예민한 날이면 마스크가 안전해요.',
  ],
  나쁨: [
    '오늘은 가능하면 나가지 마세요 😵',
    '중국이 공장을 가동하나봐요... 오늘은 바깥 공기 상태가 꽤 안 좋습니다.',
    '밖에 오래 계시면 컨디션이 확 떨어질 수 있어요. 마스크는 꼭 챙기세요.',
  ],
  '매우 나쁨': [
    '마스크 필수😷',
    '중국이 고등어 굽나봐요! 마스크 필수, 야외활동 자제!!!',
    '실내가 승리하는 날이에요. 꼭 나가야 하면 단단히 챙기세요.',
    '야외에서는 숨을 쉬면 안될 것 같아요. 마스크 필수, 야외활동 자제!!! 🚨',
    '이 정도면 웬만하면 집에 계시는 쪽을 추천드려요 🚨',
  ],
};

export const PM10_BANDS: DustBand[] = [
  { max: 30, label: '좋음' },
  { max: 80, label: '보통' },
  { max: 150, label: '나쁨' },
  { max: Number.POSITIVE_INFINITY, label: '매우 나쁨' },
];

export const PM2_5_BANDS: DustBand[] = [
  { max: 15, label: '좋음' },
  { max: 35, label: '보통' },
  { max: 75, label: '나쁨' },
  { max: Number.POSITIVE_INFINITY, label: '매우 나쁨' },
];
