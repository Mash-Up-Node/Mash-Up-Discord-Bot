import {
  buildEventUrl,
  formatEventDate,
  formatVenue,
  formatVenueLabel,
  toUpsertTicketacoEventInput,
} from '../ticketaco.utils';

describe('formatEventDate', () => {
  it('UTC 시간을 한국 시간으로 변환해 표시한다', () => {
    const result = formatEventDate('2026-04-11T04:30:00+00:00');

    expect(result).toContain('2026');
    expect(result).toContain('4');
    expect(result).toContain('11');
    expect(result).toContain('오후 01:30');
  });
});

describe('formatVenue', () => {
  it('장소명과 상세를 합쳐서 반환한다', () => {
    const result = formatVenue({
      place_name: '컬리 본사',
      place_detail: '18층',
      address: '서울 강남구',
    });

    expect(result).toBe('컬리 본사 18층');
  });

  it('장소명이 없으면 주소를 반환한다', () => {
    const result = formatVenue({
      place_name: null,
      place_detail: null,
      address: '서울 강남구',
    });

    expect(result).toBe('서울 강남구');
  });
});

describe('buildEventUrl', () => {
  it('이벤트 상세 URL을 생성한다', () => {
    expect(buildEventUrl('abc123')).toBe('https://ticketa.co/event/abc123');
  });
});

describe('formatVenueLabel', () => {
  it('장소가 없으면 기본 문구를 반환한다', () => {
    expect(formatVenueLabel(null)).toBe('장소 미정');
  });
});

describe('toUpsertTicketacoEventInput', () => {
  it('api event를 repository upsert input으로 변환한다', () => {
    const result = toUpsertTicketacoEventInput({
      id: 'event-1',
      title: '테스트 이벤트',
      status: 'PUBLIC',
      start_date: '2099-01-01T00:00:00+00:00',
      end_date: '2099-01-01T09:00:00+00:00',
      image_url: '',
      created_at: '2098-12-01T00:00:00+00:00',
      venues: {
        place_name: '컬리 본사',
        place_detail: '18층',
        address: '서울 강남구',
      },
    });

    expect(result).toEqual({
      externalEventId: 'event-1',
      title: '테스트 이벤트',
      startAt: new Date('2099-01-01T00:00:00+00:00'),
      endAt: new Date('2099-01-01T09:00:00+00:00'),
      imageUrl: null,
      venue: '컬리 본사 18층',
      sourceCreatedAt: new Date('2098-12-01T00:00:00+00:00'),
    });
  });
});
