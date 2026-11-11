
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DealDocument = HydratedDocument<Deal>;

export enum DealStatus {
    OPEN = 'open',
    PENDING_APPROVAL = 'pending_approval',
    WON = 'won',
    LOST = 'lost',
}

@Schema({ timestamps: true })
export class Deal {
    @Prop({
        required: true,
        trim: true,
    })
    title: string;

    @Prop({
        type: Types.ObjectId,
        ref: 'Customer',
        required: true,
    })
    customerId: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'Product',
        required: true,
    })
    productId: Types.ObjectId;

    @Prop({
        required: true,
        min: 1,
    })
    quantity: number;

    @Prop({
        required: true,
        min: 0,
    })
    amount: number;

    @Prop({
        default: 0,
        min: 0,
        max: 100,
    })
    discountPercent: number;

    @Prop({
        type: Types.ObjectId,
        ref: 'User',
        required: true,
    })
    ownerId: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'Branch',
        required: true,
    })
    branchId: Types.ObjectId;

    @Prop({
        type: String,
        enum: Object.values(DealStatus),
        default: DealStatus.OPEN,
    })
    status: DealStatus;
}

export const DealSchema = SchemaFactory.createForClass(Deal);

DealSchema.index({ ownerId: 1, createdAt: -1 });
DealSchema.index({ branchId: 1, createdAt: -1 });
