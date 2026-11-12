import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebhookEvent, WebhookEventSchema } from './schemas/webhook-event.schema.js';
import { WebhooksController } from './webhooks.controller.js';
import { WebhooksService } from './webhooks.service.js';
import { InvoicesModule } from '../invoices/invoices.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: WebhookEvent.name,
        schema: WebhookEventSchema,
      },
    ]),
    InvoicesModule
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule { }
