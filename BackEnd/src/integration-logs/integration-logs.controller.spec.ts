import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationLogsController } from './integration-logs.controller.js';
import { IntegrationLogsService } from './integration-logs.service.js';

describe('IntegrationLogsController', () => {
  let controller: IntegrationLogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntegrationLogsController],
      providers: [IntegrationLogsService],
    }).compile();

    controller = module.get<IntegrationLogsController>(IntegrationLogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
