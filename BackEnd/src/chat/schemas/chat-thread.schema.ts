import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatThreadDocument = ChatThread & Document;

@Schema({ timestamps: true })
export class ChatThread {
    @Prop({
        type: Types.ObjectId,
        ref: 'Deal',
        required: true,
        unique: true,
    })
    dealId: Types.ObjectId;

    @Prop({
        type: [{ type: Types.ObjectId, ref: 'User' }],
        default: [],
    })
    participants: Types.ObjectId[];

    @Prop({
        type: Map,
        of: Number,
        default: {},
    })
    unreadCounts: Map<string, number>;
}

export const ChatThreadSchema =
    SchemaFactory.createForClass(ChatThread);
