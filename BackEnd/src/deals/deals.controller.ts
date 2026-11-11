import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { DealsService } from './deals.service.js';
import { CreateDealDto } from './dto/create-deal.dto.js';
import { CurrentUser } from '../common/decorators/user.decorator.js';
import { Permissions } from '../common/decorators/permissions.decorator.js';
import { UtilityService } from '../shared/utils/utils.service.js';

@Controller('deals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DealsController {
  constructor(
    private readonly dealsService: DealsService,
    private readonly utilityService: UtilityService,
  ) { }


  @Post()
  @Permissions('deal.edit')
  async create(
    @Body() dto: CreateDealDto,
    @CurrentUser() user: any,
  ) {
    try {
      const result = await this.dealsService.create(dto, user);

      return this.utilityService.createResponse(
        'Success',
        'Create deal successful',
        result,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Deal creation failed';

      return this.utilityService.createResponse('Error', message);
    }
  }

  @Get()
  @Permissions('deal.view')
  async findAll(@CurrentUser() user: any) {
    try {
      const result = await this.dealsService.findAll(user);

      return this.utilityService.createResponse(
        'Success',
        'Fetch deals successful',
        result,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Deals fetching failed';

      return this.utilityService.createResponse('Error', message);
    }
  }

  @Get(':id')
  @Permissions('deal.view')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    try {
      const result = await this.dealsService.findOne(id, user);

      return this.utilityService.createResponse(
        'Success',
        'Fetch deal successful',
        result,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Deal fetching failed';

      return this.utilityService.createResponse('Error', message);
    }
  }
}
