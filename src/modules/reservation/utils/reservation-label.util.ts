import {
  RESERVATION_KIND_ONCE,
  RESERVATION_KIND_ONCE_DISPLAY_LABEL,
} from '../constants/reservation.constants';
import { ChannelReservation } from '../repositories/channel-reservation.repository';
import { formatWeeklyLabel } from './reservation-display.util';

export function formatReservationTypeLabel(
  reservation: ChannelReservation,
): string {
  if (reservation.kind === RESERVATION_KIND_ONCE) {
    return RESERVATION_KIND_ONCE_DISPLAY_LABEL;
  }

  return formatWeeklyLabel(reservation.dayOfWeek, reservation.timeOfDay);
}
