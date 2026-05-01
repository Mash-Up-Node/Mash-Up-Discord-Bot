export const RESERVATION_DASHBOARD_BUTTON_ONCE = 'reservation-dashboard-once';
export const RESERVATION_DASHBOARD_BUTTON_WEEKLY =
  'reservation-dashboard-weekly';
export const RESERVATION_DASHBOARD_BUTTON_REFRESH =
  'reservation-dashboard-refresh';

export const RESERVATION_WEEKLY_DAY_SELECT = 'reservation-weekly-day-select';
export const RESERVATION_MANAGE_SELECT = 'reservation-manage-select';

export const RESERVATION_MANAGE_EDIT_BUTTON =
  'reservation-manage-edit/:reservationId';
export const RESERVATION_MANAGE_DELETE_BUTTON =
  'reservation-manage-delete/:reservationId';
export const RESERVATION_MANAGE_CANCEL_BUTTON = 'reservation-manage-cancel';
export const RESERVATION_DELETE_CONFIRM_BUTTON =
  'reservation-delete-confirm/:reservationId';
export const RESERVATION_WEEKLY_CANCEL_BUTTON = 'reservation-weekly-cancel';

export const RESERVATION_MODAL_ONCE = 'reservation-modal-once';
export const RESERVATION_MODAL_WEEKLY = 'reservation-modal-weekly/:dayOfWeek';
export const RESERVATION_MODAL_UPDATE =
  'reservation-modal-update/:reservationId';

export const RESERVATION_FIELD_DATE = 'date';
export const RESERVATION_FIELD_TIME = 'time';
export const RESERVATION_FIELD_TITLE = 'title';
export const RESERVATION_FIELD_REMINDER = 'reminder';
export const RESERVATION_FIELD_REMINDER_OFFSET = 'reminder-offset';

export function buildReservationManageEditButtonId(
  reservationId: string,
): string {
  return RESERVATION_MANAGE_EDIT_BUTTON.replace(
    ':reservationId',
    reservationId,
  );
}

export function buildReservationManageDeleteButtonId(
  reservationId: string,
): string {
  return RESERVATION_MANAGE_DELETE_BUTTON.replace(
    ':reservationId',
    reservationId,
  );
}

export function buildReservationDeleteConfirmButtonId(
  reservationId: string,
): string {
  return RESERVATION_DELETE_CONFIRM_BUTTON.replace(
    ':reservationId',
    reservationId,
  );
}

export function buildReservationWeeklyModalId(dayOfWeek: string): string {
  return RESERVATION_MODAL_WEEKLY.replace(':dayOfWeek', dayOfWeek);
}

export function buildReservationUpdateModalId(reservationId: string): string {
  return RESERVATION_MODAL_UPDATE.replace(':reservationId', reservationId);
}
