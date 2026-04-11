# ORM 비교: SQLite + Supabase(PostgreSQL) 단일 코드 관리

## 요구사항

- SQLite(로컬 개발)와 Supabase(PostgreSQL, 프로덕션)를 지원
- repository 코드를 한 벌로 유지
- 환경변수로 DB만 전환

## 비교표

| ORM | 단일 repository | SQLite | PostgreSQL | NestJS 공식 | 비고 |
|-----|----------------|--------|-----------|------------|------|
| **TypeORM** | ✅ | ✅ | ✅ | ✅ `@nestjs/typeorm` | Entity 하나, DataSource만 전환 |
| **MikroORM** | ✅ | ✅ | ✅ | ✅ `@mikro-orm/nestjs` | Driver만 전환 |
| **Kysely** | ✅ | ✅ | ✅ | ⚠️ 커뮤니티 | Dialect만 전환, 쿼리 빌더 |
| **Drizzle** | ❌ | ✅ | ✅ | ⚠️ 커뮤니티 | 스키마/DB 타입이 달라 불가 |
| **Prisma** | ❌ | ✅ | ✅ | ✅ 가이드 | provider 고정, 스키마 별도 필요 |
| **Knex** | ✅ | ✅ | ✅ | ⚠️ 커뮤니티 | 저수준 쿼리 빌더 |

## 왜 TypeORM을 선택했는가

1. **단일 Entity → 단일 Repository**: DataSource 설정만 바꾸면 동일한 코드가 SQLite/PostgreSQL 모두에서 동작
2. **NestJS 공식 지원**: `@nestjs/typeorm` 패키지로 DI 통합이 매끄러움
3. **성숙한 생태계**: 문서, 커뮤니티, 검증된 패턴이 풍부
4. **마이그레이션 내장**: TypeORM CLI로 DB별 마이그레이션 관리 가능

## TypeORM 구조

```typescript
// 1. Entity 하나 정의
@Entity('study_sessions')
class StudySessionEntity {
  @PrimaryColumn() id: string;
  @Column() userId: string;
  // ...
}

// 2. DataSource를 환경변수로 전환
const dataSource = new DataSource({
  type: process.env.DB_TYPE === 'supabase' ? 'postgres' : 'sqlite',
  // ...
});

// 3. Repository 하나 — 두 DB 모두 동작
const repo = dataSource.getRepository(StudySessionEntity);
```

## Drizzle이 안 되는 이유

Drizzle은 DB별로 스키마 import가 다름:
- SQLite: `import { sqliteTable } from 'drizzle-orm/sqlite-core'`
- PostgreSQL: `import { pgTable } from 'drizzle-orm/pg-core'`

DB 인스턴스 타입도 다르고(`BetterSQLite3Database` vs `NodePgDatabase`), 쿼리 빌더 API도 미묘하게 달라서 하나의 repository로 통합 불가.
