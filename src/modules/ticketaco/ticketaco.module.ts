import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../shared/shared.module';
import { TicketacoOrganizationEntity } from './entities/ticketaco-organization.entity';
import { TicketacoSubscriptionEntity } from './entities/ticketaco-subscription.entity';
import { TicketacoEventEntity } from './entities/ticketaco-event.entity';
import { TicketacoDeliveryEntity } from './entities/ticketaco-delivery.entity';

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
  providers: [],
})
export class TicketacoModule {}
