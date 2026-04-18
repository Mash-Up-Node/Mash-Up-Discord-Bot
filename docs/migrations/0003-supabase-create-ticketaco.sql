-- Supabase 마이그레이션: ticketaco 관련 테이블
-- Supabase Dashboard > SQL Editor에서 실행하세요.

-- 1. 테이블 생성
CREATE TABLE ticketaco_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ticketaco_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES ticketaco_organizations(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES discord_channels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_ticketaco_subscriptions_org_channel UNIQUE (organization_id, channel_id)
);

CREATE TABLE ticketaco_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES ticketaco_organizations(id) ON DELETE CASCADE,
  external_event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  image_url TEXT,
  venue TEXT,
  source_created_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_ticketaco_events_org_event UNIQUE (organization_id, external_event_id)
);

CREATE TABLE ticketaco_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES ticketaco_events(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES ticketaco_subscriptions(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_ticketaco_deliveries_event_subscription UNIQUE (event_id, subscription_id)
);

-- 2. 인덱스 (조회 성능 최적화)
CREATE INDEX idx_ticketaco_events_end_start
  ON ticketaco_events(end_at, start_at);

CREATE INDEX idx_ticketaco_subscriptions_org
  ON ticketaco_subscriptions(organization_id);
