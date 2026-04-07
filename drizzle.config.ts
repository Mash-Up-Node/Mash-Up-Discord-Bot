import { Config, defineConfig } from 'drizzle-kit';

const configs: Record<string, Config> = {
  supabase: {
    dialect: 'postgresql',
    schema: './src/database/schema/supabase.schema.ts',
    out: './drizzle/supabase',
    dbCredentials: { url: process.env.DATABASE_URL! },
  },
  sqlite: {
    dialect: 'sqlite',
    schema: './src/database/schema/sqlite.schema.ts',
    out: './drizzle/sqlite',
    dbCredentials: { url: process.env.SQLITE_PATH ?? 'study.db' },
  },
};

const dbType = process.env.DB_TYPE ?? 'sqlite';

export default defineConfig(configs[dbType]);
