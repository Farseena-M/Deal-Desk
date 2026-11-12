import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import {
    Invoice,
    InvoiceDocument,
} from './schemas/invoice.schema.js';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Processor('invoice')
export class InvoiceProcessor extends WorkerHost {
    constructor(
        @InjectModel(Invoice.name)
        private readonly invoiceModel: Model<InvoiceDocument>,
        private readonly configService: ConfigService,
    ) {
        super();
    }

    async process(job: Job): Promise<void> {
        const { invoiceId } = job.data as {
            invoiceId: string;
        };

        try {
            console.log('Invoice job started:', job.id);

            const invoice = await this.invoiceModel.findById(invoiceId);

            if (!invoice) {
                throw new Error(`Invoice not found: ${invoiceId}`);
            }

            const billPortUrl =
                this.configService.get<string>('BILLPORT_URL');

            const billPortSecret =
                this.configService.get<string>('BILLPORT_SECRET');

            if (!billPortUrl || !billPortSecret) {
                throw new Error('BillPort configuration is missing');
            }

            const payload = {
                dealId: invoice.dealId.toString(),
                customerId: invoice.customerId.toString(),
                amount: invoice.amount,
            };

            const rawBody = JSON.stringify(payload);

            const signature = crypto
                .createHmac('sha256', billPortSecret)
                .update(rawBody)
                .digest('hex');

            const response = await fetch(
                `${billPortUrl}/billing/invoices`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Idempotency-Key': invoice.idempotencyKey,
                        'X-Signature': signature,
                    },
                    body: rawBody,
                    signal: AbortSignal.timeout(10000),
                },
            );

            if (!response.ok) {
                throw new Error(
                    `BillPort failed: ${response.status} ${await response.text()}`,
                );
            }

            const result = await response.json() as {
                externalId: string;
                status: string;
            };

            await this.invoiceModel.updateOne(
                { _id: invoice._id },
                {
                    $set: {
                        externalId: result.externalId,
                        status: 'pending',
                    },
                },
            );

            console.log('BillPort invoice created:', result.externalId);

        } catch (error) {
            const maxAttempts = job.opts.attempts ?? 1;
            const currentAttempt = job.attemptsMade + 1;

            console.error(
                `Invoice job failed: attempt ${currentAttempt}/${maxAttempts}`,
                error,
            );

            if (currentAttempt >= maxAttempts) {
                await this.invoiceModel.updateOne(
                    { _id: invoiceId },
                    {
                        $set: {
                            status: 'failed',
                        },
                    },
                );

                console.error('Invoice marked as permanently failed:', invoiceId);
            }

            throw error;
        }
    }
}