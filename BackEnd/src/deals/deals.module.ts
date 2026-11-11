import { Module } from '@nestjs/common';
import { DealsService } from './deals.service.js';
import { DealsController } from './deals.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Deal, DealSchema } from './schemas/deal.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Deal.name, schema: DealSchema },
    ]),
  ],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService]
})
export class DealsModule { }
