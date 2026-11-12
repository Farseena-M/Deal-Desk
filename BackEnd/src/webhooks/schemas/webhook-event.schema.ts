import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WebhookEventDocument = HydratedDocument<WebhookEvent>;

@Schema({ timestamps: true })
export class WebhookEvent {
    @Prop({ required: true, unique: true, index: true })
    eventId: string;

    @Prop({ required: true, index: true })
    externalId: string;

    @Prop({
        required: true,
        enum: ['SENT', 'VIEWED', 'PAID', 'FAILED'],
    })
    status: string;

    @Prop({ required: true })
    sequence: number;

    @Prop({ required: true })
    occurredAt: Date;
}

export const WebhookEventSchema =
    SchemaFactory.createForClass(WebhookEvent);

WebhookEventSchema.index({ externalId: 1, sequence: -1 });
