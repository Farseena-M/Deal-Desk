import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

export const app = express();
const BILLPORT_SECRET = process.env.BILLPORT_SECRET || '';

const DEALDESK_WEBHOOK_URL =
    process.env.DEALDESK_WEBHOOK_URL ||
    'http://localhost:4000/api/v1/webhooks/billport';

app.use(cors());

// Preserve the exact incoming JSON body for HMAC verification.
app.use(
    express.json({
        verify: (req: Request, _res, buffer) => {
            (req as Request & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
        },
    }),
);

// Store successful invoice responses by idempotency key.
const idempotencyStore = new Map<
    string,
    { externalId: string; status: string }
>();

// Verify HMAC-SHA256 signature.
function verifySignature(req: Request): boolean {
    const signature = req.headers['x-signature'];

    if (typeof signature !== 'string' || !signature) {
        return false;
    }

    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

    if (!rawBody) {
        return false;
    }

    const expectedSignature = crypto
        .createHmac('sha256', BILLPORT_SECRET)
        .update(rawBody)
        .digest('hex');

    const received = Buffer.from(signature, 'hex');
    const expected = Buffer.from(expectedSignature, 'hex');

    return (
        received.length === expected.length &&
        crypto.timingSafeEqual(received, expected)
    );
}


//Webhook event generation

type WebhookStatus = 'SENT' | 'VIEWED' | 'PAID' | 'FAILED';

async function sendWebhook(
    externalId: string,
    status: WebhookStatus,
    sequence: number,
): Promise<void> {
    const payload = {
        eventId: crypto.randomUUID(),
        externalId,
        status,
        sequence,
        occurredAt: new Date().toISOString(),
    };

    // Sign the exact JSON body being sent.
    const rawBody = JSON.stringify(payload);

    const signature = crypto
        .createHmac('sha256', BILLPORT_SECRET)
        .update(rawBody)
        .digest('hex');

    try {
        const response = await fetch(DEALDESK_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Signature': signature,
            },
            body: rawBody,
        });

        console.log(
            `Webhook ${status} sent:`,
            response.status,
            payload.eventId,
        );
    } catch (error) {
        console.error(`Webhook ${status} delivery failed:`, error);
    }
}



async function scheduleWebhookEvents(externalId: string): Promise<void> {
    const finalStatus: WebhookStatus =
        Math.random() < 0.8 ? 'PAID' : 'FAILED';

    const statuses: WebhookStatus[] = [
        'SENT',
        'VIEWED',
        finalStatus,
    ];

    for (let index = 0; index < statuses.length; index++) {
        // Random delay between 5 and 30 seconds.
        const delay = Math.floor(Math.random() * 26000) + 5000;

        await new Promise((resolve) => setTimeout(resolve, delay));

        await sendWebhook(
            externalId,
            statuses[index],
            index + 1,
        );
    }
}





// Health check
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        message: 'BillPort is running',
    });
});




app.post(
    '/billing/invoices',
    async (req: Request, res: Response) => {
        try {
            // 1. Verify request signature
            if (!verifySignature(req)) {
                return res.status(401).json({
                    message: 'Invalid signature',
                });
            }

            // 2. Validate idempotency key
            const idempotencyKey = req.headers['idempotency-key'];

            if (
                typeof idempotencyKey !== 'string' ||
                !idempotencyKey.trim()
            ) {
                return res.status(400).json({
                    message: 'Idempotency-Key header is required',
                });
            }

            // 3. Return previous invoice for duplicate request
            const existingInvoice = idempotencyStore.get(idempotencyKey);

            if (existingInvoice) {
                return res.status(200).json(existingInvoice);
            }

            // 4. Simulate 15% service failure
            if (Math.random() < 0.15) {
                return res.status(503).json({
                    message: 'BillPort service temporarily unavailable',
                });
            }

            // 5. Simulate 10% delayed response (6 seconds)
            if (Math.random() < 0.10) {
                await new Promise((resolve) =>
                    setTimeout(resolve, 6000),
                );
            }

            // 6. Create invoice
            const invoice = {
                externalId: crypto.randomUUID(),
                status: 'QUEUED',
            };

            // 7. Store successful response for idempotency
            idempotencyStore.set(idempotencyKey, invoice);
            void scheduleWebhookEvents(invoice.externalId);
            return res.status(201).json(invoice);

        } catch (error) {
            console.error('Invoice creation error:', error);

            return res.status(500).json({
                message: 'Internal BillPort error',
            });
        }
    }
);




app.get('/billing/invoices/:externalId', (req, res) => {
    try {
        const { externalId } = req.params;

        const invoice = Array.from(idempotencyStore.values()).find(
            (item) => item.externalId === externalId,
        );

        if (!invoice) {
            return res.status(404).json({
                message: 'Invoice not found',
            });
        }

        return res.status(200).json(invoice);
    } catch (error) {
        console.error('Fetch invoice error:', error);

        return res.status(500).json({
            message: 'Failed to fetch invoice',
        });
    }
});
