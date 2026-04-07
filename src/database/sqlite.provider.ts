import { Provider } from '@nestjs/common';
import Database from 'better-sqlite3';
import { SQLITE_DATABASE } from './database.constants';

export const sqliteProvider: Provider = {
  provide: SQLITE_DATABASE,
  useFactory: () => {
    return new Database(process.env.SQLITE_PATH || 'study.db');
  },
};
