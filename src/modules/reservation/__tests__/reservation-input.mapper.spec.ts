import {
  mapModalToUpdateReservationInput,
  mapOnceModalToCreateReservationInput,
  mapWeeklyModalToCreateReservationInput,
} from '../mappers/reservation-input.mapper';
import {
  RESERVATION_KIND_ONCE,
  RESERVATION_KIND_WEEKLY,
  RESERVATION_REMINDER_MESSAGE_MAX_LENGTH,
  RESERVATION_TITLE_MAX_LENGTH,
} from '../constants/reservation.constants';

describe('reservation-input.mapper', () => {
  describe('mapOnceModalToCreateReservationInput', () => {
    it('공백을 정리하고 기본 알림 시간을 채운다', () => {
      const input = mapOnceModalToCreateReservationInput(
        {
          date: ' 2026-04-20 ',
          time: ' 19:30 ',
          title: ' 백엔드 스터디 ',
          reminderMessage: ' 10분 뒤 시작합니다 ',
          reminderOffsetMinutes: ' ',
        },
        {
          channelId: 'channel-1',
          creatorUserId: 'user-1',
        },
      );

      expect(input).toEqual({
        kind: RESERVATION_KIND_ONCE,
        channelId: 'channel-1',
        creatorUserId: 'user-1',
        dateInput: '2026-04-20',
        timeInput: '19:30',
        title: '백엔드 스터디',
        reminderMessage: '10분 뒤 시작합니다',
        reminderOffsetMinutes: 10,
      });
    });

    it('빈 제목은 거부한다', () => {
      expect(() =>
        mapOnceModalToCreateReservationInput(
          {
            date: '2026-04-20',
            time: '19:30',
            title: '   ',
            reminderMessage: '',
            reminderOffsetMinutes: '',
          },
          {
            channelId: 'channel-1',
            creatorUserId: 'user-1',
          },
        ),
      ).toThrow('제목은 비워둘 수 없습니다.');
    });

    it('제목 길이가 제한을 넘으면 거부한다', () => {
      expect(() =>
        mapOnceModalToCreateReservationInput(
          {
            date: '2026-04-20',
            time: '19:30',
            title: '가'.repeat(RESERVATION_TITLE_MAX_LENGTH + 1),
            reminderMessage: '',
            reminderOffsetMinutes: '',
          },
          {
            channelId: 'channel-1',
            creatorUserId: 'user-1',
          },
        ),
      ).toThrow(`${RESERVATION_TITLE_MAX_LENGTH}자 이하`);
    });

    it('알림 메시지 길이가 제한을 넘으면 거부한다', () => {
      expect(() =>
        mapOnceModalToCreateReservationInput(
          {
            date: '2026-04-20',
            time: '19:30',
            title: '백엔드 스터디',
            reminderMessage: '가'.repeat(
              RESERVATION_REMINDER_MESSAGE_MAX_LENGTH + 1,
            ),
            reminderOffsetMinutes: '',
          },
          {
            channelId: 'channel-1',
            creatorUserId: 'user-1',
          },
        ),
      ).toThrow(`${RESERVATION_REMINDER_MESSAGE_MAX_LENGTH}자 이하`);
    });
  });

  describe('mapWeeklyModalToCreateReservationInput', () => {
    it('반복 예약 input을 생성한다', () => {
      const input = mapWeeklyModalToCreateReservationInput(
        {
          time: ' 20:00 ',
          title: ' 주간 회고 ',
          reminderMessage: '',
          reminderOffsetMinutes: '15',
        },
        {
          channelId: 'channel-1',
          creatorUserId: 'user-1',
          dayOfWeek: 3,
        },
      );

      expect(input).toEqual({
        kind: RESERVATION_KIND_WEEKLY,
        channelId: 'channel-1',
        creatorUserId: 'user-1',
        dayOfWeek: 3,
        timeInput: '20:00',
        title: '주간 회고',
        reminderMessage: null,
        reminderOffsetMinutes: 15,
      });
    });
  });

  describe('mapModalToUpdateReservationInput', () => {
    it('빈 메시지는 null로 정리한다', () => {
      const input = mapModalToUpdateReservationInput(
        {
          time: ' 20:00 ',
          title: ' 새 제목 ',
          reminderMessage: '   ',
          reminderOffsetMinutes: '25',
        },
        {
          channelId: 'channel-1',
          reservationId: 'reservation-1',
        },
      );

      expect(input).toEqual({
        channelId: 'channel-1',
        reservationId: 'reservation-1',
        dateInput: undefined,
        timeInput: '20:00',
        title: '새 제목',
        reminderMessage: null,
        reminderOffsetMinutes: 25,
      });
    });

    it('알림 시간 5분 단위가 아니면 거부한다', () => {
      expect(() =>
        mapModalToUpdateReservationInput(
          {
            time: '20:00',
            title: '새 제목',
            reminderMessage: '',
            reminderOffsetMinutes: '12',
          },
          {
            channelId: 'channel-1',
            reservationId: 'reservation-1',
          },
        ),
      ).toThrow('5분 단위');
    });
  });
});
