import { SQLITE_DATABASE, SUPABASE_CLIENT } from '../database.constants';

describe('Database Constants', () => {
  it('SQLITE_DATABASE는 Symbol이다', () => {
    expect(typeof SQLITE_DATABASE).toBe('symbol');
  });

  it('SUPABASE_CLIENT는 Symbol이다', () => {
    expect(typeof SUPABASE_CLIENT).toBe('symbol');
  });

  it('두 토큰은 서로 다르다', () => {
    expect(SQLITE_DATABASE).not.toBe(SUPABASE_CLIENT);
  });
});
