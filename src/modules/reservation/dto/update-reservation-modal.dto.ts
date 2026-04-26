// 모달에서 받은 값을 전달하기 위한 DTO
export class UpdateReservationModalDto {
  date?: string;
  time!: string;
  title!: string;
  reminderMessage!: string;
  reminderOffsetMinutes!: string;
}
