export interface BillPortWebhookPayload {
    eventId: string;
    externalId: string;
    status: 'SENT' | 'VIEWED' | 'PAID' | 'FAILED';
    sequence: number;
    occurredAt: string;
}