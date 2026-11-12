import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema.js';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema.js';
import { InvoicesService } from './invoices.service.js';
import { InvoicesController } from './invoices.controller.js';
import { CustomersModule } from '../customers/customers.module.js';
import { Deal, DealSchema } from '../deals/schemas/deal.schema.js';
import { BullModule } from '@nestjs/bullmq';
import { InvoiceProcessor } from './invoice.processor.js';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'invoice',
    }),
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Deal.name, schema: DealSchema },
    ]),
    CustomersModule
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService,InvoiceProcessor],
  exports: [InvoicesService],
})
export class InvoicesModule { }
