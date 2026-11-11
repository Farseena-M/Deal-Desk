import { Module } from '@nestjs/common';
import { BranchesService } from './branches.service.js';
import { BranchesController } from './branches.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Branch, BranchSchema } from './schemas/branch.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Branch.name, schema: BranchSchema },
    ]),
  ],
  controllers: [BranchesController],
  providers: [BranchesService],
})
export class BranchesModule { }
