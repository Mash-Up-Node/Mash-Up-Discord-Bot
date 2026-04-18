import { StringOption } from 'necord';

export class TicketacoSubscriptionDto {
  @StringOption({
    name: 'slug',
    description: '구독할 Ticketaco organization slug',
    required: true,
  })
  slug!: string;
}
