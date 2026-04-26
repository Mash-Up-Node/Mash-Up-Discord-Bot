import { DataSource, Repository } from 'typeorm';
import { ChannelReservationEntity } from '../entities/channel-reservation.entity';
import { ReservationNotificationEntity } from '../entities/reservation-notification.entity';
import { ChannelReservationTypeormRepository } from '../repositories/channel-reservation.typeorm-repository';

describe('ChannelReservationTypeormRepository', () => {
  let dataSource: DataSource;
  let repo: ChannelReservationTypeormRepository;
  let reservationRepo: Repository<ChannelReservationEntity>;
  let notificationRepo: Repository<ReservationNotificationEntity>;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [ChannelReservationEntity, ReservationNotificationEntity],
      synchronize: true,
    });
    await dataSource.initialize();
    reservationRepo = dataSource.getRepository(ChannelReservationEntity);
    notificationRepo = dataSource.getRepository(ReservationNotificationEntity);
    repo = new ChannelReservationTypeormRepository(
      reservationRepo,
      notificationRepo,
    );
  });

  afterEach(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('예약을 생성하고 조회한다', async () => {
    await repo.createReservation({
      channelId: 'channel-1',
      creatorUserId: 'user-1',
      kind: 'once',
      title: '백엔드 스터디',
      reminderMessage: '10분 뒤 시작합니다',
      reminderOffsetMinutes: 10,
      dayOfWeek: null,
      timeOfDay: null,
      nextScheduledAt: new Date('2026-04-20T10:30:00.000Z'),
    });

    const reservations = await repo.findByChannel('channel-1');

    expect(reservations).toHaveLength(1);
    expect(reservations[0].id).toEqual(expect.any(String));
    expect(reservations[0].title).toBe('백엔드 스터디');
    expect(reservations[0].reminderMessage).toBe('10분 뒤 시작합니다');
  });

  it('채널과 ID로 예약을 삭제한다', async () => {
    const reservation = await repo.createReservation({
      channelId: 'channel-1',
      creatorUserId: 'user-1',
      kind: 'once',
      title: '삭제 테스트',
      reminderMessage: null,
      reminderOffsetMinutes: 10,
      dayOfWeek: null,
      timeOfDay: null,
      nextScheduledAt: new Date('2026-04-20T10:30:00.000Z'),
    });

    const deleted = await repo.deleteByChannelAndId(
      'channel-1',
      reservation.id,
    );

    expect(deleted).toBe(true);
    expect(await repo.findByChannel('channel-1')).toEqual([]);
  });

  it('채널과 ID로 예약 하나를 조회한다', async () => {
    const reservation = await repo.createReservation({
      channelId: 'channel-1',
      creatorUserId: 'user-1',
      kind: 'once',
      title: '조회 테스트',
      reminderMessage: null,
      reminderOffsetMinutes: 10,
      dayOfWeek: null,
      timeOfDay: null,
      nextScheduledAt: new Date('2026-04-20T10:30:00.000Z'),
    });

    const result = await repo.findByChannelAndId('channel-1', reservation.id);

    expect(result?.id).toBe(reservation.id);
    expect(result?.title).toBe('조회 테스트');
  });

  it('특정 시각 이전의 예약만 조회한다', async () => {
    await repo.createReservation({
      channelId: 'channel-1',
      creatorUserId: 'user-1',
      kind: 'once',
      title: '일정 A',
      reminderMessage: null,
      reminderOffsetMinutes: 10,
      dayOfWeek: null,
      timeOfDay: null,
      nextScheduledAt: new Date('2026-04-20T10:30:00.000Z'),
    });
    await repo.createReservation({
      channelId: 'channel-1',
      creatorUserId: 'user-2',
      kind: 'once',
      title: '일정 B',
      reminderMessage: null,
      reminderOffsetMinutes: 15,
      dayOfWeek: null,
      timeOfDay: null,
      nextScheduledAt: new Date('2026-04-20T12:00:00.000Z'),
    });

    const dueReservations = await repo.findByNextScheduledBefore(
      new Date('2026-04-20T10:40:00.000Z'),
    );

    expect(dueReservations).toHaveLength(1);
    expect(dueReservations[0].creatorUserId).toBe('user-1');
  });

  it('예약의 알림 분 수를 수정한다', async () => {
    const reservation = await repo.createReservation({
      channelId: 'channel-1',
      creatorUserId: 'user-1',
      kind: 'once',
      title: '백엔드 스터디',
      reminderMessage: null,
      reminderOffsetMinutes: 10,
      dayOfWeek: null,
      timeOfDay: null,
      nextScheduledAt: new Date('2026-04-20T10:30:00.000Z'),
    });

    await repo.updateReservation(reservation.id, {
      reminderOffsetMinutes: 20,
    });

    const [updatedReservation] = await repo.findByChannel('channel-1');
    expect(updatedReservation.reminderOffsetMinutes).toBe(20);
  });

  it('알림 이력을 기록하고 조회한다', async () => {
    const reservation = await repo.createReservation({
      channelId: 'channel-1',
      creatorUserId: 'user-1',
      kind: 'once',
      title: '알림 테스트',
      reminderMessage: null,
      reminderOffsetMinutes: 10,
      dayOfWeek: null,
      timeOfDay: null,
      nextScheduledAt: new Date('2026-04-20T10:30:00.000Z'),
    });
    const scheduledAt = new Date('2026-04-20T10:30:00.000Z');

    expect(await repo.hasNotification(reservation.id, scheduledAt)).toBe(false);

    await repo.recordNotification(
      reservation.id,
      scheduledAt,
      new Date('2026-04-20T10:20:00.000Z'),
    );

    expect(await repo.hasNotification(reservation.id, scheduledAt)).toBe(true);
  });

  it('같은 예약 시각 알림은 한 번만 기록한다', async () => {
    const reservation = await repo.createReservation({
      channelId: 'channel-1',
      creatorUserId: 'user-1',
      kind: 'once',
      title: '중복 방지 테스트',
      reminderMessage: null,
      reminderOffsetMinutes: 10,
      dayOfWeek: null,
      timeOfDay: null,
      nextScheduledAt: new Date('2026-04-20T10:30:00.000Z'),
    });
    const scheduledAt = new Date('2026-04-20T10:30:00.000Z');

    await repo.recordNotification(
      reservation.id,
      scheduledAt,
      new Date('2026-04-20T10:20:00.000Z'),
    );
    await repo.recordNotification(
      reservation.id,
      scheduledAt,
      new Date('2026-04-20T10:21:00.000Z'),
    );

    expect(await notificationRepo.count()).toBe(1);
  });

  it('예약을 삭제하면 알림 이력도 같이 삭제한다', async () => {
    const reservation = await repo.createReservation({
      channelId: 'channel-1',
      creatorUserId: 'user-1',
      kind: 'once',
      title: '연쇄 삭제 테스트',
      reminderMessage: null,
      reminderOffsetMinutes: 10,
      dayOfWeek: null,
      timeOfDay: null,
      nextScheduledAt: new Date('2026-04-20T10:30:00.000Z'),
    });

    await repo.recordNotification(
      reservation.id,
      reservation.nextScheduledAt,
      new Date('2026-04-20T10:20:00.000Z'),
    );

    await repo.deleteById(reservation.id);

    expect(await reservationRepo.count()).toBe(0);
    expect(await notificationRepo.count()).toBe(0);
  });
});
