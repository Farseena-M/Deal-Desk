import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ApprovalConfigDocument =
    HydratedDocument<ApprovalConfig>;

@Schema({ timestamps: true })
export class ApprovalConfig {
    @Prop({ required: true, min: 0, max: 100 })
    minDiscount: number;

    @Prop({ required: true, min: 0, max: 100 })
    maxDiscount: number;

    @Prop({ default: false })
    minInclusive: boolean;

    @Prop({ default: true })
    maxInclusive: boolean;

    @Prop({ type: [String], default: [] })
    approverRoles: string[];

    @Prop({ default: false })
    autoApprove: boolean;

    @Prop({ default: true })
    isActive: boolean;
}

export const ApprovalConfigSchema =
    SchemaFactory.createForClass(ApprovalConfig);