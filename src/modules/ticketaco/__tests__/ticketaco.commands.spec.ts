import { TicketacoCommands } from '../ticketaco.commands';
import { TicketacoService } from '../ticketaco.service';
import { TicketacoUpcomingEvent } from '../ticketaco.types';

type UpcomingEventEntry = {
  orgName: string;
  event: TicketacoUpcomingEvent;
};

type InteractionReplyPayload = {
  content?: string;
  embeds?: Array<{ data: { title: string } }>;
};

type MockInteraction = {
  channelId: string;
  deferred: boolean;
  replied: boolean;
  editReplies: InteractionReplyPayload[];
  replies: InteractionReplyPayload[];
  deferReply: jest.Mock<Promise<void>, []>;
  editReply: jest.Mock<Promise<void>, [InteractionReplyPayload]>;
  reply: jest.Mock<Promise<void>, [InteractionReplyPayload]>;
};

type SubscribeOrganizationResult = {
  created: boolean;
  slug: string;
  organizationName: string;
};

function createEvent(
  overrides: Partial<TicketacoUpcomingEvent> = {},
): TicketacoUpcomingEvent {
  return {
    id: 'event-1',
    title: 'Test Event',
    startDate: '2099-01-01T00:00:00+00:00',
    endDate: '2099-01-01T09:00:00+00:00',
    imageUrl: 'https://example.com/image.webp',
    createdAt: '2099-01-01T00:00:00+00:00',
    venue: '장소 상세',
    ...overrides,
  };
}

describe('TicketacoCommands', () => {
  let commands: TicketacoCommands;
  let mockService: {
    getUpcomingEventEntries: jest.Mock<Promise<UpcomingEventEntry[]>, []>;
    subscribeOrganization: jest.Mock<
      Promise<SubscribeOrganizationResult>,
      [string, string]
    >;
  };

  function createMockInteraction(): MockInteraction {
    const interaction: MockInteraction = {
      channelId: 'channel-1',
      deferred: false,
      replied: false,
      editReplies: [],
      replies: [],
      deferReply: jest.fn<Promise<void>, []>().mockImplementation(() => {
        interaction.deferred = true;
        return Promise.resolve();
      }),
      editReply: jest
        .fn<Promise<void>, [InteractionReplyPayload]>()
        .mockImplementation((payload) => {
          interaction.editReplies.push(payload);
          return Promise.resolve();
        }),
      reply: jest
        .fn<Promise<void>, [InteractionReplyPayload]>()
        .mockImplementation((payload) => {
          interaction.replied = true;
          interaction.replies.push(payload);
          return Promise.resolve();
        }),
    };

    return interaction;
  }

  beforeEach(() => {
    mockService = {
      getUpcomingEventEntries: jest.fn<Promise<UpcomingEventEntry[]>, []>(),
      subscribeOrganization: jest.fn<
        Promise<SubscribeOrganizationResult>,
        [string, string]
      >(),
    };

    commands = new TicketacoCommands(
      mockService as unknown as TicketacoService,
    );
  });

  it('예정된 이벤트가 없으면 안내 메시지를 보낸다', async () => {
    mockService.getUpcomingEventEntries.mockResolvedValue([]);
    const interaction = createMockInteraction();

    await commands.onEvents([interaction] as never);

    expect(interaction.deferReply).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: '예정된 이벤트가 없습니다.',
      }),
    );
  });

  it('서비스에서 받은 이벤트 목록을 표시한다', async () => {
    mockService.getUpcomingEventEntries.mockResolvedValue([
      {
        orgName: 'Org B',
        event: createEvent({
          id: 'early',
          title: 'Early Event',
          startDate: '2099-01-01T00:00:00+00:00',
        }),
      },
      {
        orgName: 'Org A',
        event: createEvent({
          id: 'late',
          title: 'Late Event',
          startDate: '2099-02-01T00:00:00+00:00',
        }),
      },
    ]);
    const interaction = createMockInteraction();

    await commands.onEvents([interaction] as never);

    const payload = interaction.editReplies[0];

    expect(payload).toBeDefined();
    expect(payload?.embeds?.[0]?.data.title).toBe('Early Event');
    expect(payload?.embeds?.[1]?.data.title).toBe('Late Event');
  });

  it('조회 중 오류가 나면 에러 메시지를 보낸다', async () => {
    mockService.getUpcomingEventEntries.mockRejectedValue(new Error('boom'));
    const interaction = createMockInteraction();

    await commands.onEvents([interaction] as never);

    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: '이벤트 정보를 불러오는 중 오류가 발생했습니다.',
      }),
    );
  });

  it('현재 채널에 구독을 추가한다', async () => {
    mockService.subscribeOrganization.mockResolvedValue({
      created: true,
      slug: 'MVSATCJFOJ',
      organizationName: 'TSBM',
    });
    const interaction = createMockInteraction();

    await commands.onSubscribe(
      [interaction] as never,
      { slug: '  MVSATCJFOJ  ' } as never,
    );

    expect(mockService.subscribeOrganization).toHaveBeenCalledWith(
      '  MVSATCJFOJ  ',
      'channel-1',
    );
    const payload = interaction.editReplies[0];

    expect(payload?.content).toContain('TSBM(MVSATCJFOJ)');
  });

  it('이미 구독 중이면 안내 메시지를 보낸다', async () => {
    mockService.subscribeOrganization.mockResolvedValue({
      created: false,
      slug: 'mvsatcjfoj',
      organizationName: 'TSBM',
    });
    const interaction = createMockInteraction();

    await commands.onSubscribe(
      [interaction] as never,
      { slug: 'mvsatcjfoj' } as never,
    );

    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'ℹ️ 현재 채널은 이미 TSBM(mvsatcjfoj)을 구독 중입니다.',
      }),
    );
  });
});
