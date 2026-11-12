import {
  Controller,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { Permissions } from '../common/decorators/permissions.decorator.js';
import { CurrentUser } from '../common/decorators/user.decorator.js';
import { UtilityService } from '../shared/utils/utils.service.js';
import type { AuthenticatedUser } from '../deals/interfaces/authenticatedUser.js';

@Controller('invoices')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly utilityService: UtilityService,
  ) { }

  @Post('from-deal/:dealId')
  @Permissions('invoice.issue')
  async createFromDeal(
    @Param('dealId') dealId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    try {
      const result =
        await this.invoicesService.createLocalInvoice(
          dealId,
          user,
        );

      return this.utilityService.createResponse(
        'Success',
        'Local invoice created successfully',
        result,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Invoice creation failed';

      return this.utilityService.createResponse(
        'Error',
        message,
      );
    }
  }
}
