import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SelfPingService } from '../self-ping.service';

describe('SelfPingService', () => {
  let service: SelfPingService;
  let mockConfig: { get: jest.Mock };
  let fetchSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockConfig = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SelfPingService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<SelfPingService>(SelfPingService);
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('ping', () => {
    it('RENDER_EXTERNAL_URL이 없으면 fetch를 호출하지 않는다', async () => {
      mockConfig.get.mockReturnValue(undefined);

      await service.ping();

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('RENDER_EXTERNAL_URL이 있으면 /health 경로로 fetch한다', async () => {
      mockConfig.get.mockReturnValue('https://example.onrender.com');
      fetchSpy.mockResolvedValue({ status: 200 } as Response);

      await service.ping();

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://example.onrender.com/health',
      );
    });

    it('fetch 실패 시 throw 하지 않는다', async () => {
      mockConfig.get.mockReturnValue('https://example.onrender.com');
      fetchSpy.mockRejectedValue(new Error('network down'));

      await expect(service.ping()).resolves.toBeUndefined();
    });
  });
});
