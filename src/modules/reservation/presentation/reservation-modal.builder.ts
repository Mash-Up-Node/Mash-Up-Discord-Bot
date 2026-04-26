import {
  LabelBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import {
  DAY_OF_WEEK_FULL_LABELS,
  DayOfWeek,
  RESERVATION_DATE_INPUT_MAX_LENGTH,
  RESERVATION_REMINDER_MESSAGE_MAX_LENGTH,
  RESERVATION_REMINDER_OFFSET_INPUT_MAX_LENGTH,
  RESERVATION_TIME_INPUT_MAX_LENGTH,
  RESERVATION_TITLE_MAX_LENGTH,
} from '../constants/reservation.constants';
import { ChannelReservation } from '../repositories/channel-reservation.repository';
import {
  buildReservationUpdateModalId,
  buildReservationWeeklyModalId,
  RESERVATION_FIELD_DATE,
  RESERVATION_FIELD_REMINDER,
  RESERVATION_FIELD_REMINDER_OFFSET,
  RESERVATION_FIELD_TIME,
  RESERVATION_FIELD_TITLE,
  RESERVATION_MODAL_ONCE,
} from '../constants/reservation-interaction.constants';
import { RESERVATION_MESSAGES } from '../constants/reservation.messages';
import {
  formatDateInputKst,
  formatTimeHmKst,
} from '../utils/reservation-time.util';

export function buildOneTimeReservationModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(RESERVATION_MODAL_ONCE)
    .setTitle(RESERVATION_MESSAGES.modals.onceTitle)
    .addLabelComponents(
      createShortTextInputLabel({
        customId: RESERVATION_FIELD_DATE,
        label: RESERVATION_MESSAGES.modals.fieldLabels.date,
        placeholder: RESERVATION_MESSAGES.modals.placeholders.onceDate,
        required: true,
        maxLength: RESERVATION_DATE_INPUT_MAX_LENGTH,
      }),
      createShortTextInputLabel({
        customId: RESERVATION_FIELD_TIME,
        label: RESERVATION_MESSAGES.modals.fieldLabels.time,
        placeholder: RESERVATION_MESSAGES.modals.placeholders.time,
        required: true,
        maxLength: RESERVATION_TIME_INPUT_MAX_LENGTH,
      }),
      createShortTextInputLabel({
        customId: RESERVATION_FIELD_TITLE,
        label: RESERVATION_MESSAGES.modals.fieldLabels.title,
        placeholder: RESERVATION_MESSAGES.modals.placeholders.onceTitle,
        required: true,
        maxLength: RESERVATION_TITLE_MAX_LENGTH,
      }),
      createParagraphTextInputLabel({
        customId: RESERVATION_FIELD_REMINDER,
        label: RESERVATION_MESSAGES.modals.fieldLabels.reminderMessage,
        placeholder:
          RESERVATION_MESSAGES.modals.placeholders.onceReminderMessage,
        required: false,
        maxLength: RESERVATION_REMINDER_MESSAGE_MAX_LENGTH,
      }),
      createShortTextInputLabel({
        customId: RESERVATION_FIELD_REMINDER_OFFSET,
        label: RESERVATION_MESSAGES.modals.fieldLabels.reminderOffsetMinutes,
        placeholder:
          RESERVATION_MESSAGES.modals.placeholders.reminderOffsetMinutes,
        required: false,
        maxLength: RESERVATION_REMINDER_OFFSET_INPUT_MAX_LENGTH,
      }),
    );
}

export function buildWeeklyReservationModal(
  dayOfWeek: DayOfWeek,
): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(buildReservationWeeklyModalId(String(dayOfWeek)))
    .setTitle(`🔁 ${DAY_OF_WEEK_FULL_LABELS[dayOfWeek]} 반복 예약`)
    .addLabelComponents(
      createShortTextInputLabel({
        customId: RESERVATION_FIELD_TIME,
        label: RESERVATION_MESSAGES.modals.fieldLabels.time,
        placeholder: RESERVATION_MESSAGES.modals.placeholders.time,
        required: true,
        maxLength: RESERVATION_TIME_INPUT_MAX_LENGTH,
      }),
      createShortTextInputLabel({
        customId: RESERVATION_FIELD_TITLE,
        label: RESERVATION_MESSAGES.modals.fieldLabels.title,
        placeholder: RESERVATION_MESSAGES.modals.placeholders.weeklyTitle,
        required: true,
        maxLength: RESERVATION_TITLE_MAX_LENGTH,
      }),
      createParagraphTextInputLabel({
        customId: RESERVATION_FIELD_REMINDER,
        label: RESERVATION_MESSAGES.modals.fieldLabels.reminderMessage,
        placeholder:
          RESERVATION_MESSAGES.modals.placeholders.weeklyReminderMessage,
        required: false,
        maxLength: RESERVATION_REMINDER_MESSAGE_MAX_LENGTH,
      }),
      createShortTextInputLabel({
        customId: RESERVATION_FIELD_REMINDER_OFFSET,
        label: RESERVATION_MESSAGES.modals.fieldLabels.reminderOffsetMinutes,
        placeholder:
          RESERVATION_MESSAGES.modals.placeholders.reminderOffsetMinutes,
        required: false,
        maxLength: RESERVATION_REMINDER_OFFSET_INPUT_MAX_LENGTH,
      }),
    );
}

export function buildUpdateReservationModal(
  reservation: ChannelReservation,
): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(buildReservationUpdateModalId(reservation.id))
    .setTitle(RESERVATION_MESSAGES.modals.updateTitle)
    .addLabelComponents(...buildUpdateReservationModalLabels(reservation));
}

function buildUpdateReservationModalLabels(reservation: ChannelReservation) {
  const labels: LabelBuilder[] = [];

  if (reservation.kind === 'once') {
    labels.push(
      createShortTextInputLabel({
        customId: RESERVATION_FIELD_DATE,
        label: RESERVATION_MESSAGES.modals.fieldLabels.date,
        placeholder: RESERVATION_MESSAGES.modals.placeholders.onceDate,
        required: true,
        value: formatDateInputKst(reservation.nextScheduledAt),
        maxLength: RESERVATION_DATE_INPUT_MAX_LENGTH,
      }),
    );
  }

  labels.push(
    createShortTextInputLabel({
      customId: RESERVATION_FIELD_TIME,
      label: RESERVATION_MESSAGES.modals.fieldLabels.time,
      placeholder: RESERVATION_MESSAGES.modals.placeholders.time,
      required: true,
      value:
        reservation.kind === 'weekly'
          ? reservation.timeOfDay
          : formatTimeHmKst(reservation.nextScheduledAt),
      maxLength: RESERVATION_TIME_INPUT_MAX_LENGTH,
    }),
    createShortTextInputLabel({
      customId: RESERVATION_FIELD_TITLE,
      label: RESERVATION_MESSAGES.modals.fieldLabels.title,
      placeholder: RESERVATION_MESSAGES.modals.placeholders.updateTitle,
      required: true,
      value: reservation.title,
      maxLength: RESERVATION_TITLE_MAX_LENGTH,
    }),
    createParagraphTextInputLabel({
      customId: RESERVATION_FIELD_REMINDER,
      label: RESERVATION_MESSAGES.modals.fieldLabels.reminderMessage,
      placeholder:
        RESERVATION_MESSAGES.modals.placeholders.updateReminderMessage,
      required: false,
      value: reservation.reminderMessage ?? undefined,
      maxLength: RESERVATION_REMINDER_MESSAGE_MAX_LENGTH,
    }),
    createShortTextInputLabel({
      customId: RESERVATION_FIELD_REMINDER_OFFSET,
      label: RESERVATION_MESSAGES.modals.fieldLabels.reminderOffsetMinutes,
      placeholder:
        RESERVATION_MESSAGES.modals.placeholders.reminderOffsetMinutes,
      required: false,
      value: String(reservation.reminderOffsetMinutes),
      maxLength: RESERVATION_REMINDER_OFFSET_INPUT_MAX_LENGTH,
    }),
  );

  return labels;
}

function createShortTextInputLabel(input: {
  customId: string;
  label: string;
  placeholder: string;
  required: boolean;
  value?: string;
  maxLength?: number;
}) {
  return createTextInputLabel({
    ...input,
    style: TextInputStyle.Short,
  });
}

function createParagraphTextInputLabel(input: {
  customId: string;
  label: string;
  placeholder: string;
  required: boolean;
  value?: string;
  maxLength?: number;
}) {
  return createTextInputLabel({
    ...input,
    style: TextInputStyle.Paragraph,
  });
}

function createTextInputLabel(input: {
  customId: string;
  label: string;
  placeholder: string;
  required: boolean;
  style: TextInputStyle;
  value?: string;
  maxLength?: number;
}) {
  const builder = new TextInputBuilder()
    .setCustomId(input.customId)
    .setPlaceholder(input.placeholder)
    .setStyle(input.style)
    .setRequired(input.required);

  if (input.value) {
    builder.setValue(input.value);
  }

  if (input.maxLength) {
    builder.setMaxLength(input.maxLength);
  }

  return new LabelBuilder()
    .setLabel(input.label)
    .setTextInputComponent(builder);
}
