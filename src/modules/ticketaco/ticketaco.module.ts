import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  HttpTicketacoApiClient,
  TICKETACO_API_CLIENT,
} from './ticketaco-api.client';
import { TicketacoService } from './ticketaco.service';
import { TicketacoCommands } from './ticketaco.commands';
import { SharedModule } from '../shared/shared.module';
import { TicketacoOrganizationEntity } from './entities/ticketaco-organization.entity';
import { TicketacoSubscriptionEntity } from './entities/ticketaco-subscription.entity';
import { TicketacoEventEntity } from './entities/ticketaco-event.entity';
import { TicketacoDeliveryEntity } from './entities/ticketaco-delivery.entity';
import { TICKETACO_REPOSITORY } from './repositories/ticketaco.repository';
import { TicketacoTypeormRepository } from './repositories/ticketaco.typeorm-repository';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([
      TicketacoOrganizationEntity,
      TicketacoSubscriptionEntity,
      TicketacoEventEntity,
      TicketacoDeliveryEntity,
    ]),
  ],
  providers: [
    TicketacoService,
    TicketacoCommands,
    HttpTicketacoApiClient,
    {
      provide: TICKETACO_API_CLIENT,
      useExisting: HttpTicketacoApiClient,
    },
    {
      provide: TICKETACO_REPOSITORY,
      inject: [
        getRepositoryToken(TicketacoOrganizationEntity),
        getRepositoryToken(TicketacoEventEntity),
        getRepositoryToken(TicketacoDeliveryEntity),
      ],
      useFactory: (
        organizationRepo: Repository<TicketacoOrganizationEntity>,
        eventRepo: Repository<TicketacoEventEntity>,
        deliveryRepo: Repository<TicketacoDeliveryEntity>,
      ) =>
        new TicketacoTypeormRepository(
          organizationRepo,
          eventRepo,
          deliveryRepo,
        ),
    },
  ],
})
export class TicketacoModule {}
