import { ReservationDashboardInteractions } from './interactions';
import { ReservationManageInteractions } from './interactions';
import { ReservationModalInteractions } from './interactions';

export const RESERVATION_INTERACTION_PROVIDERS = [
  ReservationDashboardInteractions,
  ReservationManageInteractions,
  ReservationModalInteractions,
] as const;

export * from './interactions';
