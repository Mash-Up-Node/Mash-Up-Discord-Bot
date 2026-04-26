import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  RESERVATION_KIND_ONCE,
  RESERVATION_KIND_WEEKLY,
} from '../constants/reservation.constants';
import {
  OnceReservation,
  WeeklyReservation,
} from '../repositories/channel-reservation.repository';
import { CHANNEL_RESERVATION_REPOSITORY } from '../repositories/channel-reservation.repository';
import { ReservationService } from '../reservation.service';

describe('ReservationService', () => {
  let service: ReservationService;
  let mockRepo: Record<string, jest.Mock>;

  const baseReservation: OnceReservation = {
    id: 'reservation-1',
    channelId: 'channel-1',
    creatorUserId: 'user-1',
    kind: RESERVATION_KIND_ONCE,
    title: '백엔드 스터디',
    reminderMessage: null,
    reminderOffsetMinutes: 10,
    dayOfWeek: null,
    timeOfDay: null,
    nextScheduledAt: new Date('2026-04-20T10:30:00.000Z'),
    createdAt: new Date('2026-04-18T00:00:00.000Z'),
    updatedAt: new Date('2026-04-18T00:00:00.000Z'),
  };

  beforeEach(async () => {
    mockRepo = {
      createReservation: jest.fn(),
      findByChannel: jest.fn(),
      findByChannelAndId: jest.fn(),
      deleteByChannelAndId: jest.fn(),
      findByNextScheduledBefore: jest.fn(),
      updateReservation: jest.fn(),
      hasNotification: jest.fn().mockResolvedValue(false),
      recordNotification: jest.fn(),
      updateNextScheduled: jest.fn(),
      deleteById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        { provide: CHANNEL_RESERVATION_REPOSITORY, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
  });

  describe('createReservation', () => {
    it('1회성 예약을 생성한다', async () => {
      mockRepo.createReservation.mockResolvedValue(baseReservation);

      const result = await service.createReservation(
        {
          kind: RESERVATION_KIND_ONCE,
          channelId: 'channel-1',
          creatorUserId: 'user-1',
          dateInput: '2026-04-20',
          timeInput: '19:30',
          title: '백엔드 스터디',
          reminderMessage: '10분 뒤 시작합니다',
          reminderOffsetMinutes: 10,
        },
        new Date('2026-04-18T00:00:00.000Z'),
      );

      expect(mockRepo.createReservation).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: RESERVATION_KIND_ONCE,
          title: '백엔드 스터디',
          dayOfWeek: null,
          timeOfDay: null,
          nextScheduledAt: new Date('2026-04-20T10:30:00.000Z'),
          reminderMessage: '10분 뒤 시작합니다',
          reminderOffsetMinutes: 10,
        }),
      );
      expect(result).toEqual(baseReservation);
    });

    it('요일 반복 예약을 생성한다', async () => {
      const weeklyReservation: WeeklyReservation = {
        ...baseReservation,
        kind: RESERVATION_KIND_WEEKLY,
        dayOfWeek: 3 as const,
        nextScheduledAt: new Date('2026-04-22T11:00:00.000Z'),
        timeOfDay: '20:00',
      };
      mockRepo.createReservation.mockResolvedValue(weeklyReservation);

      await service.createReservation(
        {
          kind: RESERVATION_KIND_WEEKLY,
          channelId: 'channel-1',
          creatorUserId: 'user-1',
          dayOfWeek: 3,
          timeInput: '20:00',
          title: '주간 회고',
          reminderMessage: null,
          reminderOffsetMinutes: 10,
        },
        new Date('2026-04-18T00:00:00.000Z'),
      );

      expect(mockRepo.createReservation).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: RESERVATION_KIND_WEEKLY,
          dayOfWeek: 3,
          timeOfDay: '20:00',
          nextScheduledAt: new Date('2026-04-22T11:00:00.000Z'),
          reminderOffsetMinutes: 10,
        }),
      );
    });

    it('알림 시간을 분 단위로 저장한다', async () => {
      mockRepo.createReservation.mockResolvedValue({
        ...baseReservation,
        reminderOffsetMinutes: 30,
      });

      await service.createReservation(
        {
          kind: RESERVATION_KIND_ONCE,
          channelId: 'channel-1',
          creatorUserId: 'user-1',
          dateInput: '2026-04-20',
          timeInput: '19:30',
          title: '백엔드 스터디',
          reminderMessage: null,
          reminderOffsetMinutes: 30,
        },
        new Date('2026-04-18T00:00:00.000Z'),
      );

      expect(mockRepo.createReservation).toHaveBeenCalledWith(
        expect.objectContaining({
          reminderOffsetMinutes: 30,
        }),
      );
    });

    it('과거 시각은 거부한다', async () => {
      await expect(
        service.createReservation(
          {
            kind: RESERVATION_KIND_ONCE,
            channelId: 'channel-1',
            creatorUserId: 'user-1',
            dateInput: '2026-04-17',
            timeInput: '19:30',
            title: '지난 일정',
            reminderMessage: null,
            reminderOffsetMinutes: 10,
          },
          new Date('2026-04-18T00:00:00.000Z'),
        ),
      ).rejects.toThrow('과거 시각');
    });

    it('유효하지 않은 시간 형식은 거부한다', async () => {
      await expect(
        service.createReservation(
          {
            kind: RESERVATION_KIND_ONCE,
            channelId: 'channel-1',
            creatorUserId: 'user-1',
            dateInput: '2026-04-20',
            timeInput: '25:99',
            title: '백엔드 스터디',
            reminderMessage: null,
            reminderOffsetMinutes: 10,
          },
          new Date('2026-04-18T00:00:00.000Z'),
        ),
      ).rejects.toThrow('시간 형식');
    });
  });

  describe('reservation lookup', () => {
    it('현재 채널 예약을 반환한다', async () => {
      mockRepo.findByChannel.mockResolvedValue([baseReservation]);

      const result = await service.listReservations('channel-1');

      expect(mockRepo.findByChannel).toHaveBeenCalledWith('channel-1');
      expect(result).toEqual([baseReservation]);
    });

    it('ID로 현재 채널 예약 하나를 조회한다', async () => {
      mockRepo.findByChannelAndId.mockResolvedValue(baseReservation);

      const result = await service.getReservation('channel-1', 'reservation-1');

      expect(mockRepo.findByChannelAndId).toHaveBeenCalledWith(
        'channel-1',
        'reservation-1',
      );
      expect(result).toEqual(baseReservation);
    });
  });

  describe('deleteReservation', () => {
    it('정확한 ID로 예약을 삭제한다', async () => {
      mockRepo.deleteByChannelAndId.mockResolvedValue(true);

      const result = await service.deleteReservation(
        'channel-1',
        'reservation-1',
      );

      expect(mockRepo.deleteByChannelAndId).toHaveBeenCalledWith(
        'channel-1',
        'reservation-1',
      );
      expect(result).toBe(true);
    });
  });

  describe('updateReservation', () => {
    it('알림 메시지를 비우면 기본 안내 문구로 되돌릴 수 있다', async () => {
      mockRepo.findByChannelAndId.mockResolvedValue({
        ...baseReservation,
        reminderMessage: '기존 커스텀 메시지',
      });

      const result = await service.updateReservation({
        channelId: 'channel-1',
        reservationId: 'reservation-1',
        title: '새 제목',
        reminderMessage: null,
        reminderOffsetMinutes: 10,
      });

      expect(mockRepo.updateReservation).toHaveBeenCalledWith('reservation-1', {
        title: '새 제목',
        reminderMessage: null,
        reminderOffsetMinutes: 10,
      });
      expect(result.reminderMessage).toBeNull();
    });

    it('알림 시간을 수정할 수 있다', async () => {
      mockRepo.findByChannelAndId.mockResolvedValue(baseReservation);

      await service.updateReservation({
        channelId: 'channel-1',
        reservationId: 'reservation-1',
        title: '새 제목',
        reminderMessage: null,
        reminderOffsetMinutes: 25,
      });

      expect(mockRepo.updateReservation).toHaveBeenCalledWith('reservation-1', {
        title: '새 제목',
        reminderMessage: null,
        reminderOffsetMinutes: 25,
      });
    });

    it('1회성 예약 날짜와 시간을 수정할 수 있다', async () => {
      mockRepo.findByChannelAndId.mockResolvedValue(baseReservation);

      const result = await service.updateReservation(
        {
          channelId: 'channel-1',
          reservationId: 'reservation-1',
          dateInput: '2026-04-21',
          timeInput: '20:00',
          title: '새 제목',
          reminderMessage: null,
          reminderOffsetMinutes: 10,
        },
        new Date('2026-04-18T00:00:00.000Z'),
      );

      expect(mockRepo.updateReservation).toHaveBeenCalledWith('reservation-1', {
        title: '새 제목',
        reminderMessage: null,
        reminderOffsetMinutes: 10,
        nextScheduledAt: new Date('2026-04-21T11:00:00.000Z'),
      });
      expect(result.nextScheduledAt).toEqual(
        new Date('2026-04-21T11:00:00.000Z'),
      );
    });

    it('1회성 예약 날짜만 수정하면 기존 시간을 유지한다', async () => {
      mockRepo.findByChannelAndId.mockResolvedValue(baseReservation);

      const result = await service.updateReservation(
        {
          channelId: 'channel-1',
          reservationId: 'reservation-1',
          dateInput: '2026-04-21',
          title: '새 제목',
          reminderMessage: null,
          reminderOffsetMinutes: 10,
        },
        new Date('2026-04-18T00:00:00.000Z'),
      );

      expect(mockRepo.updateReservation).toHaveBeenCalledWith('reservation-1', {
        title: '새 제목',
        reminderMessage: null,
        reminderOffsetMinutes: 10,
        nextScheduledAt: new Date('2026-04-21T10:30:00.000Z'),
      });
      expect(result.nextScheduledAt).toEqual(
        new Date('2026-04-21T10:30:00.000Z'),
      );
    });

    it('반복 예약 시간을 수정하면 다음 예약 시각을 다시 계산한다', async () => {
      const weeklyReservation: WeeklyReservation = {
        ...baseReservation,
        kind: RESERVATION_KIND_WEEKLY,
        dayOfWeek: 3,
        timeOfDay: '20:00',
        nextScheduledAt: new Date('2026-04-22T11:00:00.000Z'),
      };
      mockRepo.findByChannelAndId.mockResolvedValue(weeklyReservation);

      const result = await service.updateReservation(
        {
          channelId: 'channel-1',
          reservationId: 'reservation-1',
          timeInput: '21:30',
          title: '새 제목',
          reminderMessage: null,
          reminderOffsetMinutes: 10,
        },
        new Date('2026-04-18T00:00:00.000Z'),
      );

      expect(mockRepo.updateReservation).toHaveBeenCalledWith('reservation-1', {
        title: '새 제목',
        reminderMessage: null,
        reminderOffsetMinutes: 10,
        timeOfDay: '21:30',
        nextScheduledAt: new Date('2026-04-22T12:30:00.000Z'),
      });
      expect(result).toEqual(
        expect.objectContaining({
          timeOfDay: '21:30',
          nextScheduledAt: new Date('2026-04-22T12:30:00.000Z'),
        }),
      );
    });
  });

  describe('processDueReservations', () => {
    it('설정된 분 수 기준으로 예약 알림을 보내고 상태를 갱신한다', async () => {
      const sendReminder = jest.fn().mockResolvedValue(true);
      const now = new Date('2026-04-20T10:20:00.000Z');

      mockRepo.findByNextScheduledBefore.mockResolvedValue([baseReservation]);

      await service.processDueReservations(sendReminder, now);

      expect(sendReminder).toHaveBeenCalledWith(baseReservation);
      expect(mockRepo.hasNotification).toHaveBeenCalledWith(
        'reservation-1',
        baseReservation.nextScheduledAt,
      );
      expect(mockRepo.recordNotification).toHaveBeenCalledWith(
        'reservation-1',
        baseReservation.nextScheduledAt,
        expect.any(Date),
      );
    });

    it('예약마다 다른 알림 분 수를 적용한다', async () => {
      const sendReminder = jest.fn().mockResolvedValue(true);
      const reservation = {
        ...baseReservation,
        reminderOffsetMinutes: 30,
      };
      const now = new Date('2026-04-20T10:00:00.000Z');

      mockRepo.findByNextScheduledBefore.mockResolvedValue([reservation]);

      await service.processDueReservations(sendReminder, now);

      expect(sendReminder).toHaveBeenCalledWith(reservation);
    });

    it('지난 1회성 예약은 비활성화한다', async () => {
      const sendReminder = jest.fn().mockResolvedValue(true);
      const pastReservation = {
        ...baseReservation,
        nextScheduledAt: new Date('2026-04-20T10:19:00.000Z'),
      };

      mockRepo.findByNextScheduledBefore.mockResolvedValue([pastReservation]);

      await service.processDueReservations(
        sendReminder,
        new Date('2026-04-20T10:20:00.000Z'),
      );

      expect(sendReminder).not.toHaveBeenCalled();
      expect(mockRepo.deleteById).toHaveBeenCalledWith('reservation-1');
    });

    it('지난 반복 예약은 다음 예약 시각으로 이동한다', async () => {
      const sendReminder = jest.fn().mockResolvedValue(true);
      const weeklyReservation: WeeklyReservation = {
        ...baseReservation,
        kind: RESERVATION_KIND_WEEKLY,
        dayOfWeek: 3,
        timeOfDay: '20:00',
        nextScheduledAt: new Date('2026-04-15T11:00:00.000Z'),
      };

      mockRepo.findByNextScheduledBefore.mockResolvedValue([
        weeklyReservation,
      ]);

      await service.processDueReservations(
        sendReminder,
        new Date('2026-04-18T00:00:00.000Z'),
      );

      expect(mockRepo.updateNextScheduled).toHaveBeenCalledWith(
        'reservation-1',
        new Date('2026-04-22T11:00:00.000Z'),
      );
    });

    it('알림 전송이 실패하면 상태를 갱신하지 않고 다음 예약 처리를 이어간다', async () => {
      const sendReminder = jest
        .fn()
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);
      const nextReservation: OnceReservation = {
        ...baseReservation,
        id: 'reservation-2',
        title: '프론트엔드 스터디',
        nextScheduledAt: new Date('2026-04-20T10:29:00.000Z'),
      };
      const now = new Date('2026-04-20T10:20:00.000Z');

      mockRepo.findByNextScheduledBefore.mockResolvedValue([
        baseReservation,
        nextReservation,
      ]);

      await service.processDueReservations(sendReminder, now);

      expect(sendReminder).toHaveBeenNthCalledWith(1, baseReservation);
      expect(sendReminder).toHaveBeenNthCalledWith(2, nextReservation);
      expect(mockRepo.recordNotification).toHaveBeenCalledTimes(1);
      expect(mockRepo.recordNotification).toHaveBeenCalledWith(
        'reservation-2',
        nextReservation.nextScheduledAt,
        expect.any(Date),
      );
    });

    it('같은 예약 시각에 이미 알림 이력이 있으면 다시 보내지 않는다', async () => {
      const sendReminder = jest.fn().mockResolvedValue(true);
      mockRepo.findByNextScheduledBefore.mockResolvedValue([baseReservation]);
      mockRepo.hasNotification.mockResolvedValue(true);

      await service.processDueReservations(
        sendReminder,
        new Date('2026-04-20T10:20:00.000Z'),
      );

      expect(sendReminder).not.toHaveBeenCalled();
      expect(mockRepo.recordNotification).not.toHaveBeenCalled();
    });

    it('한 예약 처리 중 저장소 오류가 나도 다음 예약 처리를 이어간다', async () => {
      const loggerErrorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();
      const sendReminder = jest.fn().mockResolvedValue(true);
      const nextReservation: OnceReservation = {
        ...baseReservation,
        id: 'reservation-2',
        title: '프론트엔드 스터디',
        nextScheduledAt: new Date('2026-04-20T10:29:00.000Z'),
      };

      mockRepo.findByNextScheduledBefore.mockResolvedValue([
        baseReservation,
        nextReservation,
      ]);
      mockRepo.hasNotification
        .mockRejectedValueOnce(new Error('db unavailable'))
        .mockResolvedValueOnce(false);

      await expect(
        service.processDueReservations(
          sendReminder,
          new Date('2026-04-20T10:20:00.000Z'),
        ),
      ).resolves.toBeUndefined();

      expect(sendReminder).toHaveBeenCalledTimes(1);
      expect(sendReminder).toHaveBeenCalledWith(nextReservation);
      expect(mockRepo.recordNotification).toHaveBeenCalledTimes(1);
      expect(mockRepo.recordNotification).toHaveBeenCalledWith(
        'reservation-2',
        nextReservation.nextScheduledAt,
        expect.any(Date),
      );
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('reservationId=reservation-1'),
        expect.any(String),
      );

      loggerErrorSpy.mockRestore();
    });
  });
});
