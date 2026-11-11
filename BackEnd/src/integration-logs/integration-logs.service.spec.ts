import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationLogsService } from './integration-logs.service.js';

describe('IntegrationLogsService', () => {
  let service: IntegrationLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntegrationLogsService],
    }).compile();

    service = module.get<IntegrationLogsService>(IntegrationLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
