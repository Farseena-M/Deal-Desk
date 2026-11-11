import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ApprovalRequestDocument =
    HydratedDocument<ApprovalRequest>;

@Schema({ _id: false })
export class ApprovalStep {
    @Prop({ required: true })
    step: number;

    @Prop({ required: true })
    approverRole: string;

    @Prop({
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    })
    status: string;
}

export const ApprovalStepSchema =
    SchemaFactory.createForClass(ApprovalStep);

@Schema({ timestamps: true })
export class ApprovalRequest {
    @Prop({
        type: Types.ObjectId,
        ref: 'Deal',
        required: true,
    })
    dealId: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'User',
        required: true,
    })
    requestedBy: Types.ObjectId;

    @Prop({ required: true })
    discountPercent: number;

    @Prop({
        type: [ApprovalStepSchema],
        default: [],
    })
    approvalChain: ApprovalStep[];

    @Prop({ default: 0 })
    currentStep: number;

    @Prop({
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    })
    status: string;
}

export const ApprovalRequestSchema =
    SchemaFactory.createForClass(ApprovalRequest);

ApprovalRequestSchema.index({
    status: 1,
    currentStep: 1,
});