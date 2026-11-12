import {
    Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import {
    WebhookEvent,
    WebhookEventDocument,
} from './schemas/webhook-event.schema.js';
import { BillPortWebhookPayload } from './interfaces/BillPortWebhookPayload.js';
import { InvoicesService } from '../invoices/invoices.service.js';


@Injectable()
export class WebhooksService {
    private readonly billPortSecret: string;

    constructor(
        @InjectModel(WebhookEvent.name)
        private readonly webhookEventModel: Model<WebhookEventDocument>,
        private readonly configService: ConfigService,
        private readonly invoicesService: InvoicesService,
    ) {
        this.billPortSecret =
            this.configService.get<string>('BILLPORT_SECRET') || '';
    }

    verifySignature(rawBody: Buffer, signature: string): boolean {
        if (
            !this.billPortSecret ||
            !/^[a-f0-9]{64}$/i.test(signature)
        ) {
            return false;
        }

        const expectedSignature = crypto
            .createHmac('sha256', this.billPortSecret)
            .update(rawBody)
            .digest('hex');

        const received = Buffer.from(signature, 'hex');
        const expected = Buffer.from(expectedSignature, 'hex');

        return (
            received.length === expected.length &&
            crypto.timingSafeEqual(received, expected)
        );
    }

    async processWebhook(
        payload: BillPortWebhookPayload,
    ): Promise<void> {
        try {
            // Ignore duplicate event IDs.
            const existingEvent = await this.webhookEventModel.findOne({
                eventId: payload.eventId,
            });

            if (existingEvent) {
                console.log('Duplicate webhook ignored:', payload.eventId);
                return;
            }

            // Find the latest successfully stored sequence for this invoice.
            const latestEvent = await this.webhookEventModel
                .findOne({ externalId: payload.externalId })
                .sort({ sequence: -1 });

            // Ignore stale or out-of-order events.
            if (
                latestEvent &&
                payload.sequence <= latestEvent.sequence
            ) {
                console.log(
                    'Stale webhook ignored:',
                    payload.eventId,
                    'Sequence:',
                    payload.sequence,
                );
                return;
            }

            // 1. Update the actual invoice.
            await this.invoicesService.updateStatusFromWebhook(
                payload.externalId,
                payload.status,
            );

            // 2. Save the webhook event after successful invoice update.
            await this.webhookEventModel.create({
                eventId: payload.eventId,
                externalId: payload.externalId,
                status: payload.status,
                sequence: payload.sequence,
                occurredAt: new Date(payload.occurredAt),
            });

            console.log(
                'Webhook processed:',
                payload.status,
                payload.externalId,
                'Sequence:',
                payload.sequence,
            );

            console.log(
                'Webhook processed:',
                payload.status,
                payload.externalId,
                'Sequence:',
                payload.sequence,
            );
        } catch (error: any) {
            if (error?.code === 11000) {
                console.log('Duplicate webhook ignored:', payload.eventId);
                return;
            }

            throw error;
        }
    }
}
