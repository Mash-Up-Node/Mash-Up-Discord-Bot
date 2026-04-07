import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const studySessions = pgTable('study_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  channelId: text('channel_id').notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  leftAt: timestamp('left_at', { withTimezone: true }),
  duration: integer('duration'),
});
