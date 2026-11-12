import {
  Controller,
  Post,
  Req,
  Body,
  Headers,
  HttpCode,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { WebhooksService } from './webhooks.service.js';

interface BillPortWebhookPayload {
  eventId: string;
  externalId: string;
  status: 'SENT' | 'VIEWED' | 'PAID' | 'FAILED';
  sequence: number;
  occurredAt: string;
}

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
  ) { }

  @Post('billport')
  @HttpCode(200)
  async receiveBillPortWebhook(
    @Body() payload: BillPortWebhookPayload,
    @Headers('x-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!req.rawBody || !signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    const isValid = this.webhooksService.verifySignature(
      req.rawBody,
      signature,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    if (
      !payload.eventId ||
      !payload.externalId ||
      !['SENT', 'VIEWED', 'PAID', 'FAILED'].includes(payload.status) ||
      !Number.isInteger(payload.sequence) ||
      payload.sequence < 1 ||
      !Number.isFinite(Date.parse(payload.occurredAt))
    ) {
      throw new BadRequestException('Invalid webhook payload');
    }

    // Acknowledge immediately; process the event asynchronously.
    const response = { received: true };

    void this.webhooksService.processWebhook(payload).catch((error) => {
      console.error('Webhook processing failed:', error);
    });

    return response;
  }
}
