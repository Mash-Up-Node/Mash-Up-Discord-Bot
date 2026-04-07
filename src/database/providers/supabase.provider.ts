import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../database.constants';

export const supabaseProvider: Provider = {
  provide: SUPABASE_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    return createClient(
      config.getOrThrow<string>('SUPABASE_URL'),
      config.getOrThrow<string>('SUPABASE_ANON_KEY'),
    );
  },
};
