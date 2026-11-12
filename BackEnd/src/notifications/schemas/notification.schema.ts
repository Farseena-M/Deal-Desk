import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
    @Prop({
        type: Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    })
    userId: Types.ObjectId;

    @Prop({
        required: true,
        trim: true,
    })
    title: string;

    @Prop({
        required: true,
        trim: true,
    })
    message: string;

    @Prop({
        required: true,
        enum: ['INVOICE_PAID', 'DEAL_UPDATE', 'GENERAL'],
    })
    type: string;

    @Prop({
        type: Types.ObjectId,
        ref: 'Deal',
        default: null,
    })
    dealId?: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'Invoice',
        default: null,
    })
    invoiceId?: Types.ObjectId;

    @Prop({ default: false, index: true })
    isRead: boolean;
}

export const NotificationSchema =
    SchemaFactory.createForClass(Notification);
