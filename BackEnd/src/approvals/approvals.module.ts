import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ApprovalConfig,
  ApprovalConfigSchema,
} from './schemas/approval-config.schema.js';
import {
  ApprovalRequest,
  ApprovalRequestSchema,
} from './schemas/approval-request.schema.js';
import {
  ApprovalHistory,
  ApprovalHistorySchema,
} from './schemas/approval-history.schema.js';
import { ApprovalsService } from './approvals.service.js';
import { ApprovalsController } from './approvals.controller.js';
import { DealsModule } from '../deals/deals.module.js';
import { Deal, DealSchema } from '../deals/schemas/deal.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ApprovalConfig.name,
        schema: ApprovalConfigSchema,
      },
      {
        name: ApprovalRequest.name,
        schema: ApprovalRequestSchema,
      },
      {
        name: ApprovalHistory.name,
        schema: ApprovalHistorySchema,
      },
      {
        name: Deal.name,
        schema: DealSchema,
      },
    ]),
    DealsModule
  ],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
  exports: [ApprovalsService],
})
export class ApprovalsModule { }