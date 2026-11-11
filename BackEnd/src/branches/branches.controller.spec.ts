import { Test, TestingModule } from '@nestjs/testing';
import { BranchesController } from './branches.controller.js';
import { BranchesService } from './branches.service.js';

describe('BranchesController', () => {
  let controller: BranchesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BranchesController],
      providers: [BranchesService],
    }).compile();

    controller = module.get<BranchesController>(BranchesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
