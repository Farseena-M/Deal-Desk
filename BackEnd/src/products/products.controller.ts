import { Controller, Get } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import type { AuthenticatedUser } from '../deals/interfaces/authenticatedUser.js';
import { UtilityService } from '../shared/utils/utils.service.js';
import { CurrentUser } from '../common/decorators/user.decorator.js';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly utilityService: UtilityService,
  ) { }

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    try {
      const result = await this.productsService.findAll(user);
      return this.utilityService.createResponse(
        'Success',
        'Fetch products successful',
        result,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Products fetching failed';

      return this.utilityService.createResponse('Error', message);
    }
  }
}