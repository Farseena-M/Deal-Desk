import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApprovalsService } from './approvals.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { Permissions } from '../common/decorators/permissions.decorator.js';
import { CurrentUser } from '../common/decorators/user.decorator.js';
import { CreateApprovalConfigDto } from './dtos/create-approval-config.dto.js';
import { UpdateApprovalConfigDto } from './dtos/update-approval-config.dto.js';
import { RequestApprovalDto } from './dtos/request-approval.dto.js';
import { ApprovalActionDto } from './dtos/approval-action.dto.js';
import { UtilityService } from '../shared/utils/utils.service.js';

@Controller('approvals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ApprovalsController {
  constructor(
    private readonly approvalsService: ApprovalsService,
    private readonly utilityService: UtilityService,
  ) { }

  @Post('config')
  @Permissions('approval-config.manage')
  async createConfig(@Body() dto: CreateApprovalConfigDto) {
    try {
      const result = await this.approvalsService.createConfig(dto);

      return this.utilityService.createResponse(
        'Success',
        'Approval configuration created successfully',
        result,
      );
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Failed to create approval configuration';

      return this.utilityService.createResponse('Error', message);
    }
  }



  @Get('config')
  @Permissions('approval-config.manage')
  async getConfigs() {
    try {
      const result = await this.approvalsService.getConfigs();

      return this.utilityService.createResponse(
        'Success',
        'Approval configurations fetched successfully',
        result,
      );
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Failed to fetch approval configurations';

      return this.utilityService.createResponse('Error', message);
    }
  }



  @Put('config/:id')
  @Permissions('approval-config.manage')
  async updateConfig(
    @Param('id') id: string,
    @Body() dto: UpdateApprovalConfigDto,
  ) {
    try {
      const result = await this.approvalsService.updateConfig(id, dto);

      return this.utilityService.createResponse(
        'Success',
        'Approval configuration updated successfully',
        result,
      );
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Failed to update approval configuration';

      return this.utilityService.createResponse('Error', message);
    }
  }



  @Post('request')
  @Permissions('deal.edit')
  async requestApproval(
    @Body() dto: RequestApprovalDto,
    @CurrentUser() user: any,
  ) {
    try {
      const result = await this.approvalsService.requestApproval(dto, user);

      return this.utilityService.createResponse(
        'Success',
        result.message,
        result,
      );
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Failed to request discount approval';

      return this.utilityService.createResponse('Error', message);
    }
  }



  @Get('pending')
  @Permissions('discount.approve')
  async getPendingApprovals(@CurrentUser() user: any) {
    try {
      const result = await this.approvalsService.getPendingApprovals(user);

      return this.utilityService.createResponse(
        'Success',
        'Pending approvals fetched successfully',
        result,
      );
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Failed to fetch approvals';

      return this.utilityService.createResponse('Error', message);
    }
  }



  @Post(':requestId/action')
  @Permissions('discount.approve')
  async processApproval(
    @Param('requestId') requestId: string,
    @Body() dto: ApprovalActionDto,
    @CurrentUser() user: any,
  ) {
    try {
      const result = await this.approvalsService.processApproval(
        requestId,
        dto,
        user,
      );

      return this.utilityService.createResponse(
        'Success',
        result.message,
        result,
      );
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Failed to process approval';

      return this.utilityService.createResponse('Error', message);
    }
  }
}