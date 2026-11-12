import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document;

@Schema({ timestamps: true })
export class ChatMessage {
    @Prop({
        type: Types.ObjectId,
        ref: 'ChatThread',
        required: true,
    })
    threadId: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'User',
        required: true,
    })
    senderId: Types.ObjectId;

    @Prop({
        required: true,
        trim: true,
    })
    message: string;

    @Prop({
        type: [{ type: Types.ObjectId, ref: 'User' }],
        default: [],
    })
    readBy: Types.ObjectId[];
}

export const ChatMessageSchema =
    SchemaFactory.createForClass(ChatMessage);

ChatMessageSchema.index({ threadId: 1, createdAt: 1 });
