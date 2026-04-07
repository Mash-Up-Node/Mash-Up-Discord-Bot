import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const studySessions = sqliteTable('study_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  channelId: text('channel_id').notNull(),
  joinedAt: text('joined_at').notNull(),
  leftAt: text('left_at'),
  duration: integer('duration'),
});
