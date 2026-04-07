import { supabaseProvider } from '../providers/supabase.provider';
import { SUPABASE_CLIENT } from '../database.constants';

describe('supabaseProvider', () => {
  it('SUPABASE_CLIENT 토큰으로 제공된다', () => {
    expect(supabaseProvider).toHaveProperty('provide', SUPABASE_CLIENT);
  });

  it('ConfigService를 inject한다', () => {
    expect(supabaseProvider).toHaveProperty('inject');
  });

  it('useFactory가 SupabaseClient를 반환한다', () => {
    const factory = (
      supabaseProvider as {
        useFactory: (config: {
          getOrThrow: (key: string) => string;
        }) => unknown;
      }
    ).useFactory;

    const mockConfig = {
      getOrThrow: (key: string) => {
        const values: Record<string, string> = {
          SUPABASE_URL: 'https://test.supabase.co',
          SUPABASE_ANON_KEY: 'test-key',
        };
        return values[key];
      },
    };

    const client = factory(mockConfig);
    expect(client).toBeDefined();
  });
});
