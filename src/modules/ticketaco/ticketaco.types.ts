export interface TicketacoUpcomingEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  imageUrl: string | null;
  createdAt: string;
  venue: string | null;
}

export interface TicketacoUpcomingEventEntry {
  orgName: string;
  event: TicketacoUpcomingEvent;
}
