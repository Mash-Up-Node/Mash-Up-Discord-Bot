import { sqliteProvider } from '../sqlite.provider';
import { SQLITE_DATABASE } from '../database.constants';

describe('sqliteProvider', () => {
  it('SQLITE_DATABASE 토큰으로 제공된다', () => {
    expect(sqliteProvider).toHaveProperty('provide', SQLITE_DATABASE);
  });

  it('useFactory가 Database 인스턴스를 반환한다', () => {
    const factory = (sqliteProvider as { useFactory: () => unknown })
      .useFactory;
    const db = factory();

    expect(db).toBeDefined();
    expect(typeof (db as { close: () => void }).close).toBe('function');

    (db as { close: () => void }).close();
  });
});
