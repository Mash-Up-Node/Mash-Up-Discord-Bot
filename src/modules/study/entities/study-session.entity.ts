export interface StudySession {
  id: string;
  userId: string;
  channelId: string;
  joinedAt: Date;
  leftAt: Date | null;
  duration: number | null; // 초 단위
}
