import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InvoiceDocument = HydratedDocument<Invoice>;

@Schema({ timestamps: true })
export class Invoice {
    @Prop({ type: Types.ObjectId, ref: 'Deal', required: true, index: true })
    dealId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, index: true })
    customerId: Types.ObjectId;

    @Prop({
        type: String, unique: true, sparse: true, index: true,
    })
    externalId?: string;

    @Prop({ required: true, unique: true })
    idempotencyKey: string;

    @Prop({
        required: true,
        enum: ['pending', 'sent', 'viewed', 'paid', 'failed'],
        default: 'pending',
    })
    status: string;

    @Prop({ required: true, min: 0 })
    amount: number;

    @Prop({ default: false })
    balanceUpdated: boolean;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
