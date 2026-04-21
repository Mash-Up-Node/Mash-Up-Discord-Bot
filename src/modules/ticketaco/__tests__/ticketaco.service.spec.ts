import { Client, SendableChannels } from 'discord.js';
import { TicketacoApiClient, TicketacoEvent } from '../ticketaco-api.client';
import { TicketacoService } from '../ticketaco.service';
import {
  EnsureTicketacoSubscriptionInput,
  TicketacoNotificationCandidate,
  TicketacoOrganization,
  TicketacoRepository,
  UpsertTicketacoEventInput,
} from '../repositories/ticketaco.repository';
import { TicketacoUpcomingEventEntry } from '../ticketaco.types';

type TicketacoOrganizationResponse = Awaited<
  ReturnType<TicketacoApiClient['fetchOrganization']>
>;

type NotificationPayload = {
  embeds: Array<{ data: { title: string } }>;
};

type TicketacoServiceScheduler = {
  syncOrganizations: () => Promise<void>;
};

const organization: TicketacoOrganization = {
  id: 'org-1',
  slug: 'test-org',
  name: 'Test Org',
  subscriptions: [{ id: 'sub-1', channelId: '123456' }],
};

const futureEvent: TicketacoEvent = {
  id: 'new-event',
  title: 'New Event',
  status: 'PUBLIC',
  start_date: '2099-06-01T00:00:00+00:00',
  end_date: '2099-06-01T09:00:00+00:00',
  image_url: 'https://example.com/img.webp',
  created_at: '2099-05-01T00:00:00+00:00',
  venues: { place_name: '장소', place_detail: null, address: '서울' },
};

const makeResponse = (
  events: TicketacoEvent[] = [],
  organizationName = 'Test Org',
): TicketacoOrganizationResponse => ({
  organization: { id: 'ticketaco-org', name: organizationName },
  events,
});

const notificationCandidate: TicketacoNotificationCandidate = {
  eventId: 'db-event-1',
  subscriptionId: 'sub-1',
  channelId: '123456',
  orgName: 'Test Org',
  event: {
    id: 'new-event',
    title: 'New Event',
    startDate: '2099-06-01T00:00:00+00:00',
    endDate: '2099-06-01T09:00:00+00:00',
    imageUrl: 'https://example.com/img.webp',
    createdAt: '2099-05-01T00:00:00+00:00',
    venue: '장소',
  },
};

let mockFetchResult: TicketacoOrganizationResponse = makeResponse();

const mockSend = jest
  .fn<Promise<void>, [NotificationPayload]>()
  .mockResolvedValue(undefined);
const mockChannel = {
  isSendable: () => true,
  send: mockSend,
} as unknown as SendableChannels;

const isReadyMock = jest.fn(() => true);
const fetchChannelMock = jest.fn().mockResolvedValue(mockChannel);
const mockClient = {
  isReady: isReadyMock,
  channels: { fetch: fetchChannelMock },
} as unknown as Client;

const mockApiClient: TicketacoApiClient = {
  fetchOrganization: jest
    .fn<Promise<TicketacoOrganizationResponse>, [string]>()
    .mockImplementation(() => Promise.resolve(mockFetchResult)),
};

const mockRepository: {
  getOrganizations: jest.Mock<Promise<TicketacoOrganization[]>, []>;
  updateOrganizationName: jest.Mock<Promise<void>, [string, string]>;
  ensureSubscription: jest.Mock<
    Promise<boolean>,
    [EnsureTicketacoSubscriptionInput]
  >;
  upsertEvents: jest.Mock<Promise<void>, [string, UpsertTicketacoEventInput[]]>;
  getNotificationCandidates: jest.Mock<
    Promise<TicketacoNotificationCandidate[]>,
    [string]
  >;
  recordDelivery: jest.Mock<Promise<void>, [string, string, Date]>;
  getUpcomingEventEntries: jest.Mock<
    Promise<TicketacoUpcomingEventEntry[]>,
    []
  >;
} = {
  getOrganizations: jest.fn<Promise<TicketacoOrganization[]>, []>(),
  updateOrganizationName: jest.fn<Promise<void>, [string, string]>(),
  ensureSubscription: jest.fn<
    Promise<boolean>,
    [EnsureTicketacoSubscriptionInput]
  >(),
  upsertEvents: jest.fn<Promise<void>, [string, UpsertTicketacoEventInput[]]>(),
  getNotificationCandidates: jest.fn<
    Promise<TicketacoNotificationCandidate[]>,
    [string]
  >(),
  recordDelivery: jest.fn<Promise<void>, [string, string, Date]>(),
  getUpcomingEventEntries: jest.fn<
    Promise<TicketacoUpcomingEventEntry[]>,
    []
  >(),
};

async function runScheduledSync(service: TicketacoService): Promise<void> {
  await (service as unknown as TicketacoServiceScheduler).syncOrganizations();
}

describe('TicketacoService', () => {
  let service: TicketacoService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchResult = makeResponse();
    isReadyMock.mockReturnValue(true);
    fetchChannelMock.mockResolvedValue(mockChannel);
    mockRepository.getOrganizations.mockResolvedValue([organization]);
    mockRepository.updateOrganizationName.mockResolvedValue(undefined);
    mockRepository.ensureSubscription.mockResolvedValue(true);
    mockRepository.upsertEvents.mockResolvedValue(undefined);
    mockRepository.getNotificationCandidates.mockResolvedValue([]);
    mockRepository.recordDelivery.mockResolvedValue(undefined);
    mockRepository.getUpcomingEventEntries.mockResolvedValue([]);

    service = new TicketacoService(
      mockClient,
      mockApiClient,
      mockRepository as unknown as TicketacoRepository,
    );
  });

  it('organization 구독을 현재 채널에 추가한다', async () => {
    mockFetchResult = makeResponse([], 'TSBM');

    await expect(
      service.subscribeOrganization('  MVSATCJFOJ  ', 'channel-1'),
    ).resolves.toEqual({
      created: true,
      slug: 'MVSATCJFOJ',
      organizationName: 'TSBM',
    });

    expect(mockRepository.ensureSubscription).toHaveBeenCalledWith({
      slug: 'MVSATCJFOJ',
      organizationName: 'TSBM',
      channelId: 'channel-1',
    });
  });

  it('schedule sync에서 전송 성공 후에만 delivery 레코드를 생성한다', async () => {
    mockFetchResult = makeResponse([futureEvent]);
    mockRepository.getNotificationCandidates.mockResolvedValue([
      notificationCandidate,
    ]);

    await runScheduledSync(service);

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockRepository.recordDelivery).toHaveBeenCalledWith(
      'db-event-1',
      'sub-1',
      expect.any(Date),
    );
  });

  it('이미 전송된 대상은 다음 sync에서 다시 전송하지 않는다', async () => {
    mockFetchResult = makeResponse([futureEvent]);
    mockRepository.getNotificationCandidates
      .mockResolvedValueOnce([notificationCandidate])
      .mockResolvedValueOnce([]);

    await runScheduledSync(service);
    await runScheduledSync(service);

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockRepository.recordDelivery).toHaveBeenCalledTimes(1);
  });

  it('전송 실패 시 delivery 레코드를 생성하지 않는다', async () => {
    mockFetchResult = makeResponse([futureEvent]);
    mockRepository.getNotificationCandidates.mockResolvedValue([
      notificationCandidate,
    ]);
    fetchChannelMock.mockRejectedValueOnce(new Error('missing access'));

    await runScheduledSync(service);

    expect(mockRepository.recordDelivery).not.toHaveBeenCalled();
  });

  it('클라이언트가 준비되지 않으면 candidate 조회를 건너뛴다', async () => {
    mockFetchResult = makeResponse([futureEvent]);
    isReadyMock.mockReturnValue(false);

    await runScheduledSync(service);

    expect(mockSend).not.toHaveBeenCalled();
    expect(mockRepository.getNotificationCandidates).not.toHaveBeenCalled();
    expect(mockRepository.recordDelivery).not.toHaveBeenCalled();
  });

  it('organization 이름이 바뀌면 DB에 반영한다', async () => {
    mockFetchResult = makeResponse([], 'Renamed Org');

    await runScheduledSync(service);

    expect(mockRepository.updateOrganizationName).toHaveBeenCalledWith(
      'org-1',
      'Renamed Org',
    );
  });

  it('upcoming event만 정렬해서 저장한다', async () => {
    mockFetchResult = makeResponse([
      {
        ...futureEvent,
        id: 'late',
        title: 'Late Event',
        start_date: '2099-06-02T00:00:00+00:00',
        venues: {
          place_name: '늦은 장소',
          place_detail: '2층',
          address: '서울',
        },
      },
      {
        ...futureEvent,
        id: 'past',
        title: 'Past Event',
        start_date: '2020-01-01T00:00:00+00:00',
        end_date: '2020-01-01T09:00:00+00:00',
      },
      {
        ...futureEvent,
        id: 'early',
        title: 'Early Event',
        start_date: '2099-06-01T00:00:00+00:00',
        venues: {
          place_name: null,
          place_detail: null,
          address: '서울 강남구',
        },
      },
    ]);

    await runScheduledSync(service);

    const upsertedEvents = mockRepository.upsertEvents.mock.calls[0]?.[1];

    expect(upsertedEvents).toEqual([
      expect.objectContaining({
        externalEventId: 'early',
        title: 'Early Event',
        venue: '서울 강남구',
      }),
      expect.objectContaining({
        externalEventId: 'late',
        title: 'Late Event',
        venue: '늦은 장소 2층',
      }),
    ]);
  });

  it('DB에 저장된 upcoming event 목록을 그대로 반환한다', async () => {
    const entries: TicketacoUpcomingEventEntry[] = [
      {
        orgName: 'Test Org',
        event: notificationCandidate.event,
      },
    ];
    mockRepository.getUpcomingEventEntries.mockResolvedValue(entries);

    await expect(service.getUpcomingEventEntries()).resolves.toEqual(entries);
  });
});
