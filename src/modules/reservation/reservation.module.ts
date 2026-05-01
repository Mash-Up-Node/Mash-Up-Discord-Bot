import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelReservationEntity } from './entities/channel-reservation.entity';
import { ReservationNotificationEntity } from './entities/reservation-notification.entity';
import { RESERVATION_INTERACTION_PROVIDERS } from './reservation.interactions';
import { ReservationScheduler } from './reservation.scheduler';
import { ReservationService } from './reservation.service';
import { CHANNEL_RESERVATION_REPOSITORY } from './repositories/channel-reservation.repository';
import { ChannelReservationTypeormRepository } from './repositories/channel-reservation.typeorm-repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChannelReservationEntity,
      ReservationNotificationEntity,
    ]),
  ],
  providers: [
    {
      provide: CHANNEL_RESERVATION_REPOSITORY,
      inject: [
        getRepositoryToken(ChannelReservationEntity),
        getRepositoryToken(ReservationNotificationEntity),
      ],
      useFactory: (
        reservationRepo: Repository<ChannelReservationEntity>,
        notificationRepo: Repository<ReservationNotificationEntity>,
      ) =>
        new ChannelReservationTypeormRepository(
          reservationRepo,
          notificationRepo,
        ),
    },
    ReservationService,
    ReservationScheduler,
    ...RESERVATION_INTERACTION_PROVIDERS,
  ],
})
export class ReservationModule {}
