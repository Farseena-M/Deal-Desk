import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import type { Model } from 'mongoose';
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
        let savedEvent: WebhookEventDocument;

        // 1. Save the event FIRST.
        // The unique eventId index prevents simultaneous duplicates.
        try {
            savedEvent = await this.webhookEventModel.create({
                eventId: payload.eventId,
                externalId: payload.externalId,
                status: payload.status,
                sequence: payload.sequence,
                occurredAt: new Date(payload.occurredAt),
            });
        } catch (error: any) {
            if (error?.code === 11000) {
                console.log(
                    'Duplicate webhook ignored:',
                    payload.eventId,
                );
                return;
            }

            throw error;
        }

        try {
            const latestEvent = await this.webhookEventModel
                .findOne({
                    externalId: payload.externalId,
                    _id: { $ne: savedEvent._id },
                })
                .sort({ sequence: -1 });

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

            await this.invoicesService.updateStatusFromWebhook(
                payload.externalId,
                payload.status,
            );

            console.log(
                'Webhook processed:',
                payload.status,
                payload.externalId,
                'Sequence:',
                payload.sequence,
                'Event:',
                payload.eventId,
            );
        } catch (error) {
            await this.webhookEventModel.deleteOne({
                _id: savedEvent._id,
            });

            throw error;
        }
    }
}
