import { LessThanOrEqual, Repository } from 'typeorm';
import {
  ChannelReservation,
  CreateChannelReservationInput,
  UpdateChannelReservationInput,
} from './channel-reservation.repository';
import {
  RESERVATION_KIND_ONCE,
  RESERVATION_KIND_WEEKLY,
} from '../constants/reservation.constants';
import { ChannelReservationEntity } from '../entities/channel-reservation.entity';
import { ReservationNotificationEntity } from '../entities/reservation-notification.entity';
import { ChannelReservationRepository } from './channel-reservation.repository';

export class ChannelReservationTypeormRepository implements ChannelReservationRepository {
  constructor(
    private readonly reservationRepo: Repository<ChannelReservationEntity>,
    private readonly notificationRepo: Repository<ReservationNotificationEntity>,
  ) {}

  async createReservation(
    input: CreateChannelReservationInput,
  ): Promise<ChannelReservation> {
    const now = new Date();
    const reservation = this.reservationRepo.create({
      ...input,
      createdAt: now,
      updatedAt: now,
    });

    return this.toReservation(await this.reservationRepo.save(reservation));
  }

  async findByChannel(channelId: string): Promise<ChannelReservation[]> {
    const reservations = await this.reservationRepo.find({
      where: { channelId },
      order: { nextScheduledAt: 'ASC', createdAt: 'ASC' },
    });

    return reservations.map((reservation) => this.toReservation(reservation));
  }

  async findByChannelAndId(
    channelId: string,
    id: string,
  ): Promise<ChannelReservation | null> {
    const reservation = await this.reservationRepo.findOne({
      where: { channelId, id },
    });

    return reservation ? this.toReservation(reservation) : null;
  }

  async deleteByChannelAndId(channelId: string, id: string): Promise<boolean> {
    return this.reservationRepo.manager.transaction(async (manager) => {
      const reservationRepo = manager.getRepository(ChannelReservationEntity);
      const notificationRepo = manager.getRepository(
        ReservationNotificationEntity,
      );
      const result = await reservationRepo.delete({ id, channelId });

      if ((result.affected ?? 0) === 0) {
        return false;
      }

      await notificationRepo.delete({ reservationId: id });
      return true;
    });
  }

  async findByNextScheduledBefore(cutoff: Date): Promise<ChannelReservation[]> {
    // 사전 알림 대상 예약 후보를 조회
    const reservations = await this.reservationRepo.find({
      where: {
        nextScheduledAt: LessThanOrEqual(cutoff),
      },
      order: { nextScheduledAt: 'ASC', createdAt: 'ASC' },
    });

    return reservations.map((reservation) => this.toReservation(reservation));
  }

  async updateReservation(
    id: string,
    input: UpdateChannelReservationInput,
  ): Promise<void> {
    await this.reservationRepo.update(id, {
      ...input,
      updatedAt: new Date(),
    });
  }

  async hasNotification(
    reservationId: string,
    scheduledAt: Date,
  ): Promise<boolean> {
    const count = await this.notificationRepo.count({
      where: { reservationId, scheduledAt },
    });

    return count > 0;
  }

  async recordNotification(
    reservationId: string,
    scheduledAt: Date,
    sentAt: Date,
  ): Promise<void> {
    await this.notificationRepo
      .createQueryBuilder()
      .insert()
      .into(ReservationNotificationEntity)
      .values({ reservationId, scheduledAt, sentAt })
      // 중복 기록을 방지(reservationId + scheduledAt)
      .orIgnore()
      .execute();
  }

  async updateNextScheduled(id: string, nextScheduledAt: Date): Promise<void> {
    await this.reservationRepo.update(id, {
      nextScheduledAt,
      updatedAt: new Date(),
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.reservationRepo.manager.transaction(async (manager) => {
      const reservationRepo = manager.getRepository(ChannelReservationEntity);
      const notificationRepo = manager.getRepository(
        ReservationNotificationEntity,
      );

      await notificationRepo.delete({ reservationId: id });
      await reservationRepo.delete(id);
    });
  }

  // kind에 따라 예약 타입을 좁혀 반환한다.
  private toReservation(entity: ChannelReservationEntity): ChannelReservation {
    const base = {
      id: entity.id,
      channelId: entity.channelId,
      creatorUserId: entity.creatorUserId,
      title: entity.title,
      reminderMessage: entity.reminderMessage,
      reminderOffsetMinutes: entity.reminderOffsetMinutes,
      nextScheduledAt: entity.nextScheduledAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };

    if (entity.kind === RESERVATION_KIND_ONCE) {
      // once는 OnceReservation으로 반환
      return {
        ...base,
        kind: RESERVATION_KIND_ONCE,
        dayOfWeek: null,
        timeOfDay: null,
      };
    }

    if (entity.kind === RESERVATION_KIND_WEEKLY) {
      // weekly는 WeeklyReservation으로 반환
      return {
        ...base,
        kind: RESERVATION_KIND_WEEKLY,
        dayOfWeek: entity.dayOfWeek!,
        timeOfDay: entity.timeOfDay!,
      };
    }

    throw new Error(`알 수 없는 예약 유형입니다. reservationId=${entity.id}`);
  }
}
