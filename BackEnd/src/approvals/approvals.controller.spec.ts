import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalsController } from './approvals.controller.js';
import { ApprovalsService } from './approvals.service.js';

describe('ApprovalsController', () => {
  let controller: ApprovalsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApprovalsController],
      providers: [ApprovalsService],
    }).compile();

    controller = module.get<ApprovalsController>(ApprovalsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
