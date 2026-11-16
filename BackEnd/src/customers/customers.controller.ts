import { Controller, Get } from '@nestjs/common';
import type { AuthenticatedUser } from '../deals/interfaces/authenticatedUser.js';
import { UtilityService } from '../shared/utils/utils.service.js';
import { CurrentUser } from '../common/decorators/user.decorator.js';
import { CustomersService } from './customers.service.js';

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly utilityService: UtilityService,
  ) { }

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    try {
      const result = await this.customersService.findAll(user);

      return this.utilityService.createResponse(
        'Success',
        'Fetch customers successful',
        result,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Customers fetching failed';

      return this.utilityService.createResponse('Error', message);
    }
  }
}